const joi = require('joi');

// Auth Validation
const registerSchema = joi.object({
  email: joi.string().email().required().messages({
    'string.email': 'Email must be valid',
    'any.required': 'Email is required'
  }),
  password: joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  }),
  first_name: joi.string().min(2).required(),
  last_name: joi.string().min(2).required(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

// Customer Validation
const customerSchema = joi.object({
  company_name: joi.string().min(2).required().messages({
    'any.required': 'Company name is required'
  }),
  contact_person: joi.string().min(2).optional(),
  email: joi.string().email().required(),
  phone: joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  address: joi.string().optional(),
  city: joi.string().optional(),
  country: joi.string().optional(),
  tax_id: joi.string().optional(),
  credit_limit: joi.number().min(0).optional(),
  status: joi.string().valid('active', 'inactive', 'suspended').optional().default('active'),
});

// Product Validation
const productSchema = joi.object({
  sku: joi.string().min(2).required().messages({
    'any.required': 'SKU is required'
  }),
  name: joi.string().min(2).required(),
  description: joi.string().optional(),
  category: joi.string().optional(),
  unit_price: joi.number().min(0).required().messages({
    'number.min': 'Unit price must be >= 0'
  }),
  cost_price: joi.number().min(0).required(),
  unit: joi.string().optional().default('piece'),
  reorder_level: joi.number().min(0).optional().default(10),
  status: joi.string().valid('active', 'inactive', 'discontinued').optional().default('active'),
});

// Inventory Validation
const inventorySchema = joi.object({
  product_id: joi.string().uuid().required(),
  quantity_on_hand: joi.number().min(0).required(),
  quantity_reserved: joi.number().min(0).optional(),
  warehouse_location: joi.string().optional(),
});

// Sales Order Validation
const salesOrderSchema = joi.object({
  customer_id: joi.string().uuid().required(),
  order_date: joi.date().required(),
  due_date: joi.date().min(joi.ref('order_date')).required(),
  status: joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled').optional(),
  discount: joi.number().min(0).max(100).optional().default(0),
  notes: joi.string().optional(),
});

// Sales Order Item Validation
const salesOrderItemSchema = joi.object({
  product_id: joi.string().uuid().required(),
  quantity: joi.number().min(1).required().messages({
    'number.min': 'Quantity must be at least 1'
  }),
  unit_price: joi.number().min(0).required(),
  discount_percent: joi.number().min(0).max(100).optional().default(0),
});

// Purchase Order Validation
const purchaseOrderSchema = joi.object({
  supplier_name: joi.string().min(2).required(),
  po_date: joi.date().required(),
  expected_delivery_date: joi.date().min(joi.ref('po_date')).required(),
  status: joi.string().valid('pending', 'confirmed', 'received', 'cancelled').optional(),
  notes: joi.string().optional(),
});

// Purchase Order Item Validation
const purchaseOrderItemSchema = joi.object({
  product_id: joi.string().uuid().required(),
  quantity: joi.number().min(1).required(),
  unit_price: joi.number().min(0).required(),
});

// Middleware for validation
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ message: 'Validation error', errors: error.details });
    }
    req.validatedData = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  customerSchema,
  productSchema,
  inventorySchema,
  salesOrderSchema,
  salesOrderItemSchema,
  purchaseOrderSchema,
  purchaseOrderItemSchema,
  validate,
};
