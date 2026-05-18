from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import timedelta
from app.api.deps import get_current_active_user, get_current_active_admin
from app.core.database import get_db
from app.services.payment_service import get_payment_service
from app.services.email_service import get_email_service
from app.services.social_login_service import get_social_login_service
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole
import pyotp
import secrets

router = APIRouter()

# Payment endpoints
@router.post("/payment/process")
async def process_payment(
    payment_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Process a payment using the specified payment provider
    Expected payment_data: {
        "amount": float,
        "currency": str,
        "provider": str (stripe/paypal),
        "payment_method_data": dict
    }
    """
    provider = payment_data.get("provider", "stripe").lower()
    amount = payment_data.get("amount")
    currency = payment_data.get("currency", "usd")
    payment_method_data = payment_data.get("payment_method_data", {})

    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    try:
        payment_service = get_payment_service(provider)
        result = await payment_service.process_payment(amount, currency, payment_method_data)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Payment processing failed"))

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")

@router.post("/payment/refund")
async def refund_payment(
    refund_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_admin),  # Only admins can refund
    db: Session = Depends(get_db)
):
    """
    Refund a payment
    Expected refund_data: {
        "payment_id": str,
        "amount": float (optional, if not provided refunds full amount),
        "provider": str (stripe/paypal)
    }
    """
    provider = refund_data.get("provider", "stripe").lower()
    payment_id = refund_data.get("payment_id")
    amount = refund_data.get("amount")

    if not payment_id:
        raise HTTPException(status_code=400, detail="Payment ID is required")

    try:
        payment_service = get_payment_service(provider)
        result = await payment_service.refund_payment(payment_id, amount)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Refund failed"))

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refund error: {str(e)}")

# Email endpoints
@router.post("/email/send")
async def send_email(
    email_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send an email
    Expected email_data: {
        "to_emails": List[str],
        "subject": str,
        "body": str,
        "is_html": bool (optional),
        "provider": str (smtp/sendgrid/ses) optional
    }
    """
    to_emails = email_data.get("to_emails", [])
    subject = email_data.get("subject", "")
    body = email_data.get("body", "")
    is_html = email_data.get("is_html", False)
    provider = email_data.get("provider", "smtp").lower()

    if not to_emails or not subject or not body:
        raise HTTPException(status_code=400, detail="to_emails, subject, and body are required")

    try:
        email_service = get_email_service(provider)
        # For better UX, we can send emails in background
        background_tasks.add_task(
            email_service.send_email,
            to_emails=to_emails,
            subject=subject,
            body=body,
            is_html=is_html
        )
        return {
            "success": True,
            "message": "Email queued for sending"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email sending error: {str(e)}")

@router.post("/email/template")
async def send_template_email(
    email_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send a template-based email
    Expected email_data: {
        "to_emails": List[str],
        "template_id": str,
        "template_data": Dict[str, Any],
        "provider": str (smtp/sendgrid/ses) optional
    }
    """
    to_emails = email_data.get("to_emails", [])
    template_id = email_data.get("template_id", "")
    template_data = email_data.get("template_data", {})
    provider = email_data.get("provider", "smtp").lower()

    if not to_emails or not template_id:
        raise HTTPException(status_code=400, detail="to_emails and template_id are required")

    try:
        email_service = get_email_service(provider)
        background_tasks.add_task(
            email_service.send_template_email,
            to_emails=to_emails,
            template_id=template_id,
            template_data=template_data
        )
        return {
            "success": True,
            "message": "Template email queued for sending"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template email error: {str(e)}")

# Social login endpoints
@router.get("/oauth/{provider}")
async def social_login(provider: str, redirect_uri: str, state: Optional[str] = None):
    """
    Initiate social login flow
    """
    if not state:
        state = secrets.token_urlsafe(32)

    try:
        social_service = get_social_login_service(provider)
        auth_url = social_service.get_authorization_url(state, redirect_uri)
        return {
            "authorization_url": auth_url,
            "state": state
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Social login error: {str(e)}")

@router.get("/oauth/{provider}/callback")
async def social_login_callback(
    provider: str,
    code: str,
    state: str,
    redirect_uri: str,
    db: Session = Depends(get_db)
):
    """
    Handle social login callback
    """
    try:
        social_service = get_social_login_service(provider)

        # Exchange code for access token
        token_result = await social_service.get_access_token(code, redirect_uri)
        if not token_result.get("access_token"):
            raise HTTPException(status_code=400, detail="Failed to get access token")

        access_token = token_result["access_token"]

        # Get user info from provider
        user_info = await social_service.get_user_info(access_token)
        if not user_info.get("success"):
            raise HTTPException(status_code=400, detail="Failed to get user info from provider")

        # Check if user exists with this email
        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email provided by social login provider")

        existing_user = db.query(User).filter(User.email == email).first()

        if existing_user:
            # Link social account to existing user (simplified)
            # In a full implementation, you'd store the social ID and provider
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": existing_user.email, "user_id": str(existing_user.id), "role": existing_user.role},
                expires_delta=access_token_expires
            )
            refresh_token = create_refresh_token(data={"sub": existing_user.email, "user_id": str(existing_user.id)})

            return {
                "success": True,
                "message": "Login successful",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": str(existing_user.id),
                    "email": existing_user.email,
                    "first_name": existing_user.first_name,
                    "last_name": existing_user.last_name,
                    "role": existing_user.role
                },
                "is_new_user": False
            }
        else:
            # Create new user from social login data
            # Generate a random password since we don't have one from social login
            random_password = secrets.token_urlsafe(16)
            hashed_password = get_password_hash(random_password)

            new_user = User(
                email=email,
                password_hash=hashed_password,
                first_name=user_info.get("first_name", ""),
                last_name=user_info.get("last_name", ""),
                role=UserRole.STAFF,  # Default role for social login users
                is_active=True
            )

            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            # Create access and refresh tokens for new user
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": new_user.email, "user_id": str(new_user.id), "role": new_user.role},
                expires_delta=access_token_expires
            )
            refresh_token = create_refresh_token(data={"sub": new_user.email, "user_id": str(new_user.id)})

            return {
                "success": True,
                "message": "Account created and login successful",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": str(new_user.id),
                    "email": new_user.email,
                    "first_name": new_user.first_name,
                    "last_name": new_user.last_name,
                    "role": new_user.role
                },
                "is_new_user": True
            }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Social login callback error: {str(e)}")

# Health check for integrations
@router.get("/health")
async def integrations_health():
    """Check health of integration services"""
    health_status = {
        "payment": {"stripe": "configured" if settings.STRIPE_SECRET_KEY else "not configured"},
        "email": {"smtp": "configured" if settings.SMTP_HOST else "not configured"},
        "social": {
            "google": "configured" if settings.GOOGLE_CLIENT_ID else "not configured",
            "github": "configured" if settings.GITHUB_CLIENT_ID else "not configured"
        }
    }
    return {
        "status": "healthy",
        "services": health_status
    }