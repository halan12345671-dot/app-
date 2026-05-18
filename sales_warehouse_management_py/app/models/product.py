from sqlalchemy import Column, String, Boolean, DateTime, Enum, Numeric, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.core.database import Base
import enum

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(100), unique=True, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    category_id = Column(String(100), nullable=True)  # Simplified for now
    stock_quantity = Column(Integer, default=0, nullable=False)
    min_stock_level = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Product {self.name}>"