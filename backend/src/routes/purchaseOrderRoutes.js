const express = require('express');
const { PurchaseOrder, PurchaseOrderItem, Product, Inventory, sequelize } = require('../models');
const { validate, purchaseOrderSchema, purchaseOrderItemSchema } = require('../validators/schemas');
const { Op } = require('sequelize');

const router = express.Router();

// Get all purchase orders with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) where.po_number = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [{ model: PurchaseOrderItem, include: [{ model: Product }] }],
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
    console.error('Get purchase orders error:', error);
    res.status(500).json({ message: 'Error fetching purchase orders', error: error.message });
  }
});

// Get single purchase order
router.get('/:id', async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: PurchaseOrderItem, include: [{ model: Product }] }],
    });
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ message: 'Error fetching purchase order', error: error.message });
  }
});

// Create purchase order
router.post('/', validate(purchaseOrderSchema), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { supplier_name, po_date, expected_delivery_date, notes } = req.body;

    // Generate PO number
    const lastPO = await PurchaseOrder.findOne({
      order: [['createdAt', 'DESC']],
      transaction: t,
    });
    const poNumber = 'PO-' + (lastPO ? parseInt(lastPO.po_number.split('-')[1]) + 1 : 5001);

    const order = await PurchaseOrder.create(
      {
        po_number: poNumber,
        supplier_name,
        po_date,
        expected_delivery_date,
        status: 'pending',
        total_amount: 0,
        tax: 0,
        notes,
      },
      { transaction: t }
    );

    await t.commit();
    const fullOrder = await PurchaseOrder.findByPk(order.id, {
      include: [{ model: PurchaseOrderItem, include: [{ model: Product }] }],
    });

    res.status(201).json({ message: 'Purchase order created successfully', order: fullOrder });
  } catch (error) {
    await t.rollback();
    console.error('Create purchase order error:', error);
    res.status(500).json({ message: 'Error creating purchase order', error: error.message });
  }
});

// Add line item to purchase order
router.post('/:orderId/items', validate(purchaseOrderItemSchema), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { product_id, quantity, unit_price } = req.body;

    // Verify order exists and is not confirmed
    const order = await PurchaseOrder.findByPk(orderId, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot add items to confirmed/received orders' });
    }

    // Verify product exists
    const product = await Product.findByPk(product_id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const lineTotal = unit_price * quantity;

    // Create line item
    const item = await PurchaseOrderItem.create(
      {
        purchase_order_id: orderId,
        product_id,
        quantity,
        unit_price,
        line_total: lineTotal,
      },
      { transaction: t }
    );

    // Update order totals
    const allItems = await PurchaseOrderItem.findAll({ where: { purchase_order_id: orderId }, transaction: t });
    const subtotal = allItems.reduce((sum, item) => sum + item.line_total, 0);
    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax;

    await order.update(
      { total_amount: totalAmount, tax_amount: tax },
      { transaction: t }
    );

    await t.commit();

    const fullItem = await PurchaseOrderItem.findByPk(item.id, {
      include: [{ model: Product }],
    });

    res.status(201).json({ message: 'Line item added successfully', item: fullItem });
  } catch (error) {
    await t.rollback();
    console.error('Add line item error:', error);
    res.status(500).json({ message: 'Error adding line item', error: error.message });
  }
});

// Confirm purchase order
router.post('/:id/confirm', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, { transaction: t });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Only pending orders can be confirmed' });
    }

    await order.update({ status: 'confirmed' }, { transaction: t });
    await t.commit();

    const fullOrder = await PurchaseOrder.findByPk(order.id, {
      include: [{ model: PurchaseOrderItem, include: [{ model: Product }] }],
    });

    res.status(200).json({ message: 'Purchase order confirmed successfully', order: fullOrder });
  } catch (error) {
    await t.rollback();
    console.error('Confirm order error:', error);
    res.status(500).json({ message: 'Error confirming purchase order', error: error.message });
  }
});

// Receive purchase order (add to inventory)
router.post('/:id/receive', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: PurchaseOrderItem }],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status !== 'confirmed') {
      await t.rollback();
      return res.status(400).json({ message: 'Only confirmed orders can be received' });
    }

    // Add inventory for all line items
    for (const item of order.PurchaseOrderItems) {
      let inventory = await Inventory.findOne({
        where: { product_id: item.product_id },
        transaction: t,
      });

      if (!inventory) {
        inventory = await Inventory.create(
          {
            product_id: item.product_id,
            quantity_on_hand: item.quantity,
            quantity_reserved: 0,
            quantity_available: item.quantity,
          },
          { transaction: t }
        );
      } else {
        await inventory.update(
          {
            quantity_on_hand: inventory.quantity_on_hand + item.quantity,
            quantity_available: inventory.quantity_available + item.quantity,
          },
          { transaction: t }
        );
      }
    }

    await order.update({ status: 'received' }, { transaction: t });
    await t.commit();

    const fullOrder = await PurchaseOrder.findByPk(order.id, {
      include: [{ model: PurchaseOrderItem, include: [{ model: Product }] }],
    });

    res.status(200).json({ message: 'Purchase order received successfully', order: fullOrder });
  } catch (error) {
    await t.rollback();
    console.error('Receive order error:', error);
    res.status(500).json({ message: 'Error receiving purchase order', error: error.message });
  }
});

// Update purchase order
router.put('/:id', validate(purchaseOrderSchema), async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Can only update pending orders' });
    }

    await order.update(req.body);
    const fullOrder = await PurchaseOrder.findByPk(order.id, {
      include: [{ model: PurchaseOrderItem, include: [{ model: Product }] }],
    });
    res.status(200).json({ message: 'Purchase order updated successfully', order: fullOrder });
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ message: 'Error updating purchase order', error: error.message });
  }
});

const { authorize } = require('../middleware/auth');

// Delete purchase order (only if pending)
router.delete('/:id', authorize(['admin', 'manager']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Can only delete pending orders' });
    }

    await PurchaseOrderItem.destroy({ where: { purchase_order_id: order.id }, transaction: t });
    await order.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete purchase order error:', error);
    res.status(500).json({ message: 'Error deleting purchase order', error: error.message });
  }
});

module.exports = router;
