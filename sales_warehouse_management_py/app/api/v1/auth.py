from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import pyotp
import secrets
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    generate_mfa_secret,
    get_mfa_uri,
    verify_mfa_token,
    generate_qr_code
)
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserInDB, User
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserInDB)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Check if MFA is required
    if user.mfa_enabled:
        # Return a temporary token that requires MFA verification
        temp_token_data = {
            "sub": user.email,
            "user_id": str(user.id),
            "require_mfa": True
        }
        temp_token = create_access_token(temp_token_data, expires_delta=timedelta(minutes=5))

        return {
            "require_mfa": True,
            "temp_token": temp_token,
            "message": "MFA verification required"
        }

    # Create access and refresh tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.email, "user_id": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    }

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    # Verify refresh token
    payload = verify_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user
    user_email = payload.get("sub")
    user = db.query(User).filter(User.email == user_email).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/mfa/setup")
async def setup_mfa(current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    # In a real app, you'd get current_user from a dependency
    # For now, we'll simulate getting the user from database
    user_email = current_user.get("sub") if current_user else None
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Generate MFA secret
    secret = generate_mfa_secret()
    user.mfa_secret = secret
    db.commit()

    # Generate QR code
    uri = get_mfa_uri(user.email, secret)
    qr_code = generate_qr_code(uri)

    return {
        "secret": secret,
        "qr_code": qr_code,
        "uri": uri
    }

@router.post("/mfa/verify")
async def verify_mfa(token: str, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user_email = current_user.get("sub") if current_user else None
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )

    user = db.query(User).filter(User.email == user_email).first()
    if not user or not user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not set up for this user"
        )

    if verify_mfa_token(user.mfa_secret, token):
        # Enable MFA for user
        user.mfa_enabled = True
        db.commit()

        return {"message": "MFA enabled successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA token"
        )

@router.post("/mfa/validate")
async def validate_mfa(token: str, temp_token: str, db: Session = Depends(get_db)):
    # Validate temporary token from login
    payload = verify_token(temp_token)
    if payload is None or not payload.get("require_mfa"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired temporary token"
        )

    user_email = payload.get("sub")
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify MFA token
    if verify_mfa_token(user.mfa_secret, token):
        # Create access and refresh tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "user_id": str(user.id), "role": user.role},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": user.email, "user_id": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA token"
        )

@router.post("/logout")
async def logout_user(current_user: dict = Depends(verify_token)):
    # In a more advanced implementation, we would add the token to a blacklist
    # For now, we'll just return a success message
    return {"message": "Successfully logged out"}

# OAuth placeholder endpoints (would be implemented with actual OAuth providers)
@router.get("/oauth/{provider}")
async def oauth_login(provider: str):
    # This would redirect to the OAuth provider
    return {
        "message": f"OAuth login with {provider} not yet implemented",
        "provider": provider
    }

@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, code: str):
    # This would handle the OAuth callback
    return {
        "message": f"OAuth callback from {provider} not yet implemented",
        "provider": provider,
        "code": code
    }