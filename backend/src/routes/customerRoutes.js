const express = require('express');
const { Customer } = require('../models');
const { validate, customerSchema } = require('../validators/schemas');
const { Op } = require('sequelize');

const router = express.Router();

// Get all customers with search, filter, and pagination
router.get('/', async (req, res) => {
  try {
    const { search, city, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { company_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { contact_person: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (city) where.city = city;
    if (status) where.status = status;

    const { count, rows } = await Customer.findAndCountAll({
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
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
});

// Create customer
router.post('/', validate(customerSchema), async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
});

// Update customer
router.put('/:id', validate(customerSchema), async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await customer.update(req.body);
    res.status(200).json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
});

const { authorize } = require('../middleware/auth');

// Delete customer
router.delete('/:id', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await customer.destroy();
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
});

module.exports = router;
