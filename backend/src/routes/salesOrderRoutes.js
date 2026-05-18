const express = require('express');
const { SalesOrder, SalesOrderItem, Customer, Product, Inventory, sequelize } = require('../models');
const { validate, salesOrderSchema, salesOrderItemSchema } = require('../validators/schemas');
const { Op } = require('sequelize');

const router = express.Router();

// Get all sales orders with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer_id, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (customer_id) where.customer_id = customer_id;
    if (search) where.order_number = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await SalesOrder.findAndCountAll({
      where,
      include: [
        { model: Customer },
        { model: SalesOrderItem, include: [{ model: Product }] },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      subQuery: false,
      distinct: true,
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
    console.error('Get sales orders error:', error);
    res.status(500).json({ message: 'Error fetching sales orders', error: error.message });
  }
});

// Get single sales order
router.get('/:id', async (req, res) => {
  try {
    const order = await SalesOrder.findByPk(req.params.id, {
      include: [
        { model: Customer },
        { model: SalesOrderItem, include: [{ model: Product }] },
      ],
    });
    if (!order) {
      return res.status(404).json({ message: 'Sales order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Get sales order error:', error);
    res.status(500).json({ message: 'Error fetching sales order', error: error.message });
  }
});

// Create sales order
router.post('/', validate(salesOrderSchema), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, order_date, due_date, discount = 0, notes } = req.body;

    const discountAmount = discount || 0;

    // Verify customer exists
    const customer = await Customer.findByPk(customer_id, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Generate order number
    const lastOrder = await SalesOrder.findOne({
      order: [['createdAt', 'DESC']],
      transaction: t,
    });
    const orderNumber = 'SO-' + (lastOrder ? parseInt(lastOrder.order_number.split('-')[1]) + 1 : 1001);

    const order = await SalesOrder.create(
      {
        order_number: orderNumber,
        customer_id,
        order_date,
        due_date,
        status: 'pending',
        total_amount: 0,
        tax_amount: 0,
        discount_amount: discountAmount,
        notes,
      },
      { transaction: t }
    );

    await t.commit();
    const fullOrder = await SalesOrder.findByPk(order.id, {
      include: [
        { model: Customer },
        { model: SalesOrderItem, include: [{ model: Product }] },
      ],
    });

    res.status(201).json({ message: 'Sales order created successfully', order: fullOrder });
  } catch (error) {
    await t.rollback();
    console.error('Create sales order error:', error);
    res.status(500).json({ message: 'Error creating sales order', error: error.message });
  }
});

// Add line item to sales order
router.post('/:orderId/items', validate(salesOrderItemSchema), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { product_id, quantity, unit_price, discount_percent = 0 } = req.body;

    // Verify order exists and is not confirmed
    const order = await SalesOrder.findByPk(orderId, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Sales order not found' });
    }
    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot add items to confirmed/shipped orders' });
    }

    // Verify product exists
    const product = await Product.findByPk(product_id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check inventory
    const inventory = await Inventory.findOne({ where: { product_id }, transaction: t });
    if (!inventory || inventory.quantity_available < quantity) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    const lineTotal = (unit_price * quantity) * (1 - discount_percent / 100);

    // Create line item
    const item = await SalesOrderItem.create(
      {
        sales_order_id: orderId,
        product_id,
        quantity,
        unit_price,
        discount_percent,
        line_total: lineTotal,
      },
      { transaction: t }
    );

    // Update order totals
    const allItems = await SalesOrderItem.findAll({ where: { sales_order_id: orderId }, transaction: t });
    const subtotal = allItems.reduce((sum, item) => sum + item.line_total, 0);
    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax - order.discount_amount;

    await order.update(
      { total_amount: totalAmount, tax_amount: tax },
      { transaction: t }
    );

    await t.commit();

    const fullItem = await SalesOrderItem.findByPk(item.id, {
      include: [{ model: Product }],
    });

    res.status(201).json({ message: 'Line item added successfully', item: fullItem });
  } catch (error) {
    await t.rollback();
    console.error('Add line item error:', error);
    res.status(500).json({ message: 'Error adding line item', error: error.message });
  }
});

// Confirm order (deduct inventory and lock order)
router.post('/:id/confirm', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await SalesOrder.findByPk(req.params.id, {
      include: [{ model: SalesOrderItem }],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Sales order not found' });
    }

    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Order is already confirmed or shipped' });
    }

    // Deduct inventory for all line items
    for (const item of order.SalesOrderItems) {
      const inventory = await Inventory.findOne({
        where: { product_id: item.product_id },
        transaction: t,
      });

      if (!inventory || inventory.quantity_available < item.quantity) {
        await t.rollback();
        return res.status(400).json({ message: `Insufficient inventory for product ${item.product_id}` });
      }

      await inventory.update(
        {
          quantity_reserved: inventory.quantity_reserved + item.quantity,
          quantity_available: inventory.quantity_available - item.quantity,
        },
        { transaction: t }
      );
    }

    await order.update({ status: 'confirmed' }, { transaction: t });
    await t.commit();

    const fullOrder = await SalesOrder.findByPk(order.id, {
      include: [
        { model: Customer },
        { model: SalesOrderItem, include: [{ model: Product }] },
      ],
    });

    res.status(200).json({ message: 'Order confirmed successfully', order: fullOrder });
  } catch (error) {
    await t.rollback();
    console.error('Confirm order error:', error);
    res.status(500).json({ message: 'Error confirming order', error: error.message });
  }
});

const { authorize } = require('../middleware/auth');

// Delete sales order (only if pending)
router.delete('/:id', authorize(['admin', 'manager']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await SalesOrder.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Sales order not found' });
    }

    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Can only delete pending orders' });
    }

    await SalesOrderItem.destroy({ where: { sales_order_id: order.id }, transaction: t });
    await order.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete sales order error:', error);
    res.status(500).json({ message: 'Error deleting sales order', error: error.message });
  }
});

// Update line item
router.put('/:orderId/items/:itemId', validate(salesOrderItemSchema), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId, itemId } = req.params;
    const { product_id, quantity, unit_price, discount_percent = 0 } = req.body;

    const order = await SalesOrder.findByPk(orderId, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Sales order not found' });
    }
    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot modify confirmed orders' });
    }

    const item = await SalesOrderItem.findByPk(itemId, { transaction: t });
    if (!item || item.sales_order_id !== orderId) {
      await t.rollback();
      return res.status(404).json({ message: 'Line item not found' });
    }

    const inventory = await Inventory.findOne({ where: { product_id }, transaction: t });
    if (!inventory || inventory.quantity_available < quantity) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    const lineTotal = (unit_price * quantity) * (1 - discount_percent / 100);
    await item.update({ product_id, quantity, unit_price, discount_percent, line_total }, { transaction: t });

    const allItems = await SalesOrderItem.findAll({ where: { sales_order_id: orderId }, transaction: t });
    const subtotal = allItems.reduce((sum, i) => sum + i.line_total, 0);
    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax - order.discount_amount;
    await order.update({ total_amount: totalAmount, tax_amount: tax }, { transaction: t });

    await t.commit();
    const updatedItem = await SalesOrderItem.findByPk(itemId, { include: [{ model: Product }] });
    res.status(200).json({ message: 'Line item updated', item: updatedItem });
  } catch (error) {
    await t.rollback();
    console.error('Update line item error:', error);
    res.status(500).json({ message: 'Error updating line item', error: error.message });
  }
});

// Delete line item
router.delete('/:orderId/items/:itemId', authorize(['admin', 'manager']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId, itemId } = req.params;

    const order = await SalesOrder.findByPk(orderId, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Sales order not found' });
    }
    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot modify confirmed orders' });
    }

    const item = await SalesOrderItem.findByPk(itemId, { transaction: t });
    if (!item || item.sales_order_id !== orderId) {
      await t.rollback();
      return res.status(404).json({ message: 'Line item not found' });
    }

    await item.destroy({ transaction: t });

    const allItems = await SalesOrderItem.findAll({ where: { sales_order_id: orderId }, transaction: t });
    const subtotal = allItems.reduce((sum, i) => sum + i.line_total, 0);
    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax - order.discount_amount;
    await order.update({ total_amount: totalAmount, tax_amount: tax }, { transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Line item deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete line item error:', error);
    res.status(500).json({ message: 'Error deleting line item', error: error.message });
  }
});

module.exports = router;
