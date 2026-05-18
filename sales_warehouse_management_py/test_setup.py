"""
Test script to verify the setup of the Sales & Warehouse Management System
"""
import os
import sys
from pathlib import Path

def test_imports():
    """Test that all modules can be imported"""
    try:
        # Test core imports
        from app.core.config import settings
        from app.core.database import engine, SessionLocal, Base
        from app.core.security import verify_password, get_password_hash

        # Test model imports
        from app.models.user import User, UserRole
        from app.models.customer import Customer, CustomerStatus
        from app.models.product import Product
        from app.models.inventory import Inventory
        from app.models.sales_order import SalesOrder, OrderStatus
        from app.models.purchase_order import PurchaseOrder, PurchaseOrderStatus

        # Test schema imports
        from app.schemas.user import UserCreate, UserInDB
        from app.schemas.customer import CustomerCreate, CustomerInDB
        from app.schemas.product import ProductCreate, ProductInDB
        from app.schemas.inventory import InventoryCreate, InventoryInDB
        from app.schemas.sales_order import SalesOrderCreate, SalesOrderInDB
        from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderInDB

        # Test service imports
        from app.services.payment_service import get_payment_service
        from app.services.email_service import get_email_service
        from app.services.social_login_service import get_social_login_service

        # Test API imports
        from app.api.v1 import auth, customers, products, inventory, sales, purchases, integrations
        from app.api.deps import get_current_user

        print("✓ All imports successful")
        return True
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False

def test_environment():
    """Test environment setup"""
    try:
        # Check if .env.example exists
        if not Path(".env.example").exists():
            print("✗ .env.example not found")
            return False

        print("✓ Environment setup verified")
        return True
    except Exception as e:
        print(f"✗ Environment error: {e}")
        return False

def test_directory_structure():
    """Test that directory structure is correct"""
    try:
        required_dirs = [
            "app",
            "app/api",
            "app/api/v1",
            "app/core",
            "app/models",
            "app/schemas",
            "app/services",
            "app/utils"
        ]

        for dir_path in required_dirs:
            if not Path(dir_path).exists():
                print(f"✗ Directory missing: {dir_path}")
                return False

        print("✓ Directory structure verified")
        return True
    except Exception as e:
        print(f"✗ Directory structure error: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Sales & Warehouse Management System Setup\n")

    tests = [
        test_directory_structure,
        test_environment,
        test_imports
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()  # Empty line between tests

    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! The system is ready to use.")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())