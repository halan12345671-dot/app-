from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.inventory import Inventory
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryAdjust, InventoryInDB, Inventory

router = APIRouter()

@router.get("/", response_model=dict)
async def get_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    offset = (page - 1) * limit
    query = db.query(Inventory)

    # Apply filters if needed

    total = query.count()
    inventory_items = query.offset(offset).limit(limit).all()

    return {
        "data": [InventoryInDB.from_orm(item) for item in inventory_items],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{inventory_id}", response_model=InventoryInDB)
async def get_inventory_item(
    inventory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    inventory_item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return InventoryInDB.from_orm(inventory_item)

@router.post("/", response_model=InventoryInDB, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    inventory: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_inventory = Inventory(**inventory.dict())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return InventoryInDB.from_orm(db_inventory)

@router.put("/{inventory_id}", response_model=InventoryInDB)
async def update_inventory_item(
    inventory_id: str,
    inventory_update: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    update_data = inventory_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_inventory, field, value)

    db.commit()
    db.refresh(db_inventory)
    return InventoryInDB.from_orm(db_inventory)

@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(
    inventory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    db.delete(db_inventory)
    db.commit()
    return None

@router.post("/{inventory_id}/adjust", response_model=InventoryInDB)
async def adjust_inventory(
    inventory_id: str,
    adjustment: InventoryAdjust,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if adjustment.type not in ["increase", "decrease"]:
        raise HTTPException(status_code=400, detail="Adjustment type must be 'increase' or 'decrease'")

    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if adjustment.type == "increase":
        db_inventory.qty_on_hand += adjustment.quantity
    else:  # decrease
        new_qty = db_inventory.qty_on_hand - adjustment.quantity
        if new_qty < 0:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        db_inventory.qty_on_hand = new_qty

    db.commit()
    db.refresh(db_inventory)
    return InventoryInDB.from_orm(db_inventory)