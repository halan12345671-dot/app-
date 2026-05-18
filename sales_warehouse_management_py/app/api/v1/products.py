from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductInDB, Product

router = APIRouter()

@router.get("/", response_model=dict)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    offset = (page - 1) * limit
    query = db.query(Product)

    # Apply filters if needed (could add search, category filter, etc.)

    total = query.count()
    products = query.offset(offset).limit(limit).all()

    return {
        "data": [ProductInDB.from_orm(p) for p in products],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{product_id}", response_model=ProductInDB)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductInDB.from_orm(product)

@router.post("/", response_model=ProductInDB, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if product with SKU already exists
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product with this SKU already exists")

    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return ProductInDB.from_orm(db_product)

@router.put("/{product_id}", response_model=ProductInDB)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    return ProductInDB.from_orm(db_product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(db_product)
    db.commit()
    return None

# Additional endpoints for low stock alert, etc. could be added here