const express = require('express');
const { Product } = require('../models');
const { validate, productSchema } = require('../validators/schemas');
const { Op } = require('sequelize');

const router = express.Router();

// Get all products with search and pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const { count, rows } = await Product.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Create product
router.post('/', validate(productSchema), async (req, res) => {
  try {
    // Check if SKU already exists
    const existingSku = await Product.findOne({ where: { sku: req.body.sku } });
    if (existingSku) {
      return res.status(409).json({ message: 'SKU already exists' });
    }

    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Update product
router.put('/:id', validate(productSchema), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if new SKU already exists (and is not the same product)
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingSku = await Product.findOne({ where: { sku: req.body.sku } });
      if (existingSku) {
        return res.status(409).json({ message: 'SKU already exists' });
      }
    }

    await product.update(req.body);
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

const { authorize } = require('../middleware/auth');

// Delete product
router.delete('/:id', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;
