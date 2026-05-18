from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.purchase_order import PurchaseOrder, PurchaseOrderStatus
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderInDB, PurchaseOrder

router = APIRouter()

@router.get("/", response_model=dict)
async def get_purchase_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    offset = (page - 1) * limit
    query = db.query(PurchaseOrder)

    # Apply filters if needed (could add date range, status filter, supplier filter, etc.)

    total = query.count()
    purchase_orders = query.offset(offset).limit(limit).all()

    return {
        "data": [PurchaseOrderInDB.from_orm(po) for po in purchase_orders],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{order_id}", response_model=PurchaseOrderInDB)
async def get_purchase_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    purchase_order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return PurchaseOrderInDB.from_orm(purchase_order)

@router.post("/", response_model=PurchaseOrderInDB, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    purchase_order: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # In a more complete system, we would validate the supplier exists
    # For now, we'll just create the purchase order
    db_purchase_order = PurchaseOrder(**purchase_order.dict())
    db.add(db_purchase_order)
    db.commit()
    db.refresh(db_purchase_order)
    return PurchaseOrderInDB.from_orm(db_purchase_order)

@router.put("/{order_id}", response_model=PurchaseOrderInDB)
async def update_purchase_order(
    order_id: str,
    purchase_order_update: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_purchase_order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not db_purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    update_data = purchase_order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_purchase_order, field, value)

    db.commit()
    db.refresh(db_purchase_order)
    return PurchaseOrderInDB.from_orm(db_purchase_order)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_purchase_order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not db_purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    db.delete(db_purchase_order)
    db.commit()
    return None

# Additional endpoints for purchase order status updates, etc. could be added here