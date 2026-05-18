from fastapi import APIRouter
from app.api.v1 import auth

# Create main API router
api_router = APIRouter()

# Include auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Placeholders for other routers (to be implemented)
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
# api_router.include_router(products.router, prefix="/products", tags=["products"])
# api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
# api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
# api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
# api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])