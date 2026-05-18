const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await aiService.getDashboard();
    res.status(200).json(dashboard);
  } catch (error) {
    console.error('AI dashboard error:', error);
    res.status(500).json({ message: 'Error generating AI dashboard', error: error.message });
  }
});

router.get('/predict-demand/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;
    const prediction = await aiService.predictDemand(productId, parseInt(days));
    res.status(200).json(prediction);
  } catch (error) {
    console.error('Predict demand error:', error);
    res.status(500).json({ message: 'Error predicting demand', error: error.message });
  }
});

router.get('/reorder-suggestions', async (req, res) => {
  try {
    const suggestions = await aiService.generateReorderSuggestions();
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Reorder suggestions error:', error);
    res.status(500).json({ message: 'Error generating reorder suggestions', error: error.message });
  }
});

router.get('/order-priorities', async (req, res) => {
  try {
    const priorities = await aiService.prioritizeOrders();
    res.status(200).json(priorities);
  } catch (error) {
    console.error('Order priorities error:', error);
    res.status(500).json({ message: 'Error prioritizing orders', error: error.message });
  }
});

router.get('/inventory-health', async (req, res) => {
  try {
    const health = await aiService.getInventoryHealth();
    res.status(200).json(health);
  } catch (error) {
    console.error('Inventory health error:', error);
    res.status(500).json({ message: 'Error analyzing inventory health', error: error.message });
  }
});

module.exports = router;
