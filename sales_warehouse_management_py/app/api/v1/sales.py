from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.sales_order import SalesOrder, OrderStatus
from app.schemas.sales_order import SalesOrderCreate, SalesOrderUpdate, SalesOrderInDB, SalesOrder

router = APIRouter()

@router.get("/", response_model=dict)
async def get_sales_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    offset = (page - 1) * limit
    query = db.query(SalesOrder)

    # Apply filters if needed (could add date range, status filter, customer filter, etc.)

    total = query.count()
    sales_orders = query.offset(offset).limit(limit).all()

    return {
        "data": [SalesOrderInDB.from_orm(so) for so in sales_orders],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{order_id}", response_model=SalesOrderInDB)
async def get_sales_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sales_order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return SalesOrderInDB.from_orm(sales_order)

@router.post("/", response_model=SalesOrderInDB, status_code=status.HTTP_201_CREATED)
async def create_sales_order(
    sales_order: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if customer exists
    from app.models.customer import Customer
    customer = db.query(Customer).filter(Customer.id == sales_order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_sales_order = SalesOrder(**sales_order.dict())
    db.add(db_sales_order)
    db.commit()
    db.refresh(db_sales_order)
    return SalesOrderInDB.from_orm(db_sales_order)

@router.put("/{order_id}", response_model=SalesOrderInDB)
async def update_sales_order(
    order_id: str,
    sales_order_update: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_sales_order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not db_sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    update_data = sales_order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_sales_order, field, value)

    db.commit()
    db.refresh(db_sales_order)
    return SalesOrderInDB.from_orm(db_sales_order)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sales_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_sales_order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not db_sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    db.delete(db_sales_order)
    db.commit()
    return None

# Additional endpoints for order status updates, etc. could be added here