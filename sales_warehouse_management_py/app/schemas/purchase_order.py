from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.purchase_order import PurchaseOrderStatus

class PurchaseOrderBase(BaseModel):
    supplier_id: str  # Simplified - could be UUID to suppliers table
    order_date: Optional[datetime] = None
    status: Optional[PurchaseOrderStatus] = PurchaseOrderStatus.PENDING
    total_amount: float = Field(..., ge=0)
    notes: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[str] = None
    order_date: Optional[datetime] = None
    status: Optional[PurchaseOrderStatus] = None
    total_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class PurchaseOrderInDBBase(PurchaseOrderBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class PurchaseOrderInDB(PurchaseOrderInDBBase):
    pass

class PurchaseOrder(PurchaseOrderInDBBase):
    pass