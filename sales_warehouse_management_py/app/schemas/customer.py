from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.customer import CustomerStatus

class CustomerBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = Field(None, ge=0)
    status: Optional[CustomerStatus] = CustomerStatus.ACTIVE

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = Field(None, ge=0)
    status: Optional[CustomerStatus] = None

class CustomerInDBBase(CustomerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CustomerInDB(CustomerInDBBase):
    pass

class Customer(CustomerInDBBase):
    pass