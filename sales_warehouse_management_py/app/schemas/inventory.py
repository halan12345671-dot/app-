from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class InventoryBase(BaseModel):
    product_id: str  # UUID as string
    warehouse_location: str = Field(..., min_length=1, max_length=255)
    qty_on_hand: Optional[int] = Field(None, ge=0)
    reserved_qty: Optional[int] = Field(None, ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    product_id: Optional[str] = None
    warehouse_location: Optional[str] = Field(None, min_length=1, max_length=255)
    qty_on_hand: Optional[int] = Field(None, ge=0)
    reserved_qty: Optional[int] = Field(None, ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)

class InventoryAdjust(BaseModel):
    quantity: int = Field(..., gt=0)
    type: str  # 'increase' or 'decrease'

class InventoryInDBBase(InventoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class InventoryInDB(InventoryInDBBase):
    pass

class Inventory(InventoryInDBBase):
    pass