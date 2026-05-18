from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.customer import Customer, CustomerStatus
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerInDB, Customer

router = APIRouter()

@router.get("/", response_model=dict)
async def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    offset = (page - 1) * limit
    query = db.query(Customer)

    # Apply filters if needed (could add search, status filter, etc.)

    total = query.count()
    customers = query.offset(offset).limit(limit).all()

    return {
        "data": [CustomerInDB.from_orm(c) for c in customers],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{customer_id}", response_model=CustomerInDB)
async def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerInDB.from_orm(customer)

@router.post("/", response_model=CustomerInDB, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if customer with email already exists
    existing = db.query(Customer).filter(Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Customer with this email already exists")

    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return CustomerInDB.from_orm(db_customer)

@router.put("/{customer_id}", response_model=CustomerInDB)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)

    db.commit()
    db.refresh(db_customer)
    return CustomerInDB.from_orm(db_customer)

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(db_customer)
    db.commit()
    return None

# Additional endpoints for customer stats, etc. could be added here