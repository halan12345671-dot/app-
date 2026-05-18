const express = require('express');
const { Inventory, Product } = require('../models');
const { validate, inventorySchema } = require('../validators/schemas');

const router = express.Router();

// Get all inventory
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Inventory.findAndCountAll({
      include: [{ model: Product }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['updatedAt', 'DESC']],
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
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id, {
      include: [{ model: Product }],
    });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
});

// Create inventory
router.post('/', validate(inventorySchema), async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);
    res.status(201).json({ message: 'Inventory created successfully', inventory });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ message: 'Error creating inventory', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    await inventory.update(req.body);
    res.status(200).json({ message: 'Inventory updated successfully', inventory });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Error updating inventory', error: error.message });
  }
});

// Adjust stock (increase/decrease)
router.post('/:id/adjust', async (req, res) => {
  try {
    const { quantity, type } = req.body; // type: 'increase' or 'decrease'
    if (!quantity || !type || !['increase', 'decrease'].includes(type)) {
      return res.status(400).json({ message: 'Invalid adjustment parameters' });
    }

    const inventory = await Inventory.findByPk(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const newQty = type === 'increase' 
      ? inventory.quantity_on_hand + quantity 
      : inventory.quantity_on_hand - quantity;

    if (newQty < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await inventory.update({ quantity_on_hand: newQty });
    res.status(200).json({ message: 'Stock adjusted successfully', inventory });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ message: 'Error adjusting stock', error: error.message });
  }
});

module.exports = router;
