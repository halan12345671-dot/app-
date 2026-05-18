from sqlalchemy import Column, String, Boolean, DateTime, Enum, Numeric, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.core.database import Base
import enum

class PurchaseOrderStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    RECEIVED = "received"
    CANCELLED = "cancelled"

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(String(255), nullable=False)  # Simplified - could be FK to suppliers table
    order_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.PENDING, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PurchaseOrder {self.id} for supplier {self.supplier_id}>"