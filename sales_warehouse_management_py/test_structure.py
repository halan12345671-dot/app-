#!/usr/bin/env python3
"""
Simple test to verify the project structure
"""
import os
import sys

def test_structure():
    """Test that all required files and directories exist"""
    base_path = "sales_warehouse_management_py"

    # Required directories
    required_dirs = [
        "app",
        "app/api",
        "app/api/v1",
        "app/core",
        "app/models",
        "app/schemas",
        "app/services",
        "app/utils",
        "tests"
    ]

    # Required files
    required_files = [
        "app/main.py",
        "app/core/config.py",
        "app/core/database.py",
        "app/core/security.py",
        "app/models/user.py",
        "app/models/customer.py",
        "app/models/product.py",
        "app/models/inventory.py",
        "app/models/sales_order.py",
        "app/models/purchase_order.py",
        "app/schemas/user.py",
        "app/schemas/customer.py",
        "app/schemas/product.py",
        "app/schemas/inventory.py",
        "app/schemas/sales_order.py",
        "app/schemas/purchase_order.py",
        "app/api/v1/auth.py",
        "app/api/v1/customers.py",
        "app/api/v1/products.py",
        "app/api/v1/inventory.py",
        "app/api/v1/sales.py",
        "app/api/v1/purchases.py",
        "app/api/v1/integrations.py",
        "app/api/deps.py",
        "app/api/v1/router.py",
        "app/services/payment_service.py",
        "app/services/email_service.py",
        "app/services/social_login_service.py",
        "requirements.txt",
        ".env.example",
        "README.md"
    ]

    print("Testing project structure...")

    # Check directories
    for dir_path in required_dirs:
        full_path = os.path.join(base_path, dir_path)
        if not os.path.isdir(full_path):
            print(f"❌ Missing directory: {full_path}")
            return False
        print(f"✅ Directory exists: {full_path}")

    # Check files
    for file_path in required_files:
        full_path = os.path.join(base_path, file_path)
        if not os.path.isfile(full_path):
            print(f"❌ Missing file: {full_path}")
            return False
        print(f"✅ File exists: {full_path}")

    print("\n🎉 All required files and directories are present!")
    return True

if __name__ == "__main__":
    success = test_structure()
    sys.exit(0 if success else 1)