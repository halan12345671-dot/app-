from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.sales_order import OrderStatus

class SalesOrderBase(BaseModel):
    customer_id: str  # UUID as string
    order_date: Optional[datetime] = None
    status: Optional[OrderStatus] = OrderStatus.PENDING
    total_amount: float = Field(..., ge=0)
    notes: Optional[str] = None

class SalesOrderCreate(SalesOrderBase):
    pass

class SalesOrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    order_date: Optional[datetime] = None
    status: Optional[OrderStatus] = None
    total_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class SalesOrderInDBBase(SalesOrderBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class SalesOrderInDB(SalesOrderInDBBase):
    pass

class SalesOrder(SalesOrderInDBBase):
    pass