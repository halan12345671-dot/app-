const { SalesOrder, SalesOrderItem, PurchaseOrder, PurchaseOrderItem, Inventory, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

class AIService {
  async predictDemand(productId, daysAhead = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const sales = await SalesOrderItem.findAll({
        where: {
          product_id: productId,
        },
        include: [{
          model: SalesOrder,
          where: {
            status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] },
            order_date: { [Op.gte]: startDate, [Op.lte]: endDate }
          }
        }],
        order: [[sequelize.col('SalesOrder.order_date'), 'ASC']]
      });

      if (sales.length === 0) {
        return { predicted_demand: 0, confidence: 0, trend: 'stable' };
      }

      const dailySales = {};
      sales.forEach(item => {
        const date = item.SalesOrder.order_date.toISOString().split('T')[0];
        dailySales[date] = (dailySales[date] || 0) + item.quantity;
      });

      const dates = Object.keys(dailySales).sort();
      const values = dates.map(d => dailySales[d]);

      const totalDays = 90;
      const avgDaily = values.reduce((a, b) => a + b, 0) / totalDays;
      const predictedDemand = Math.ceil(avgDaily * daysAhead);

      const recentAvg = values.slice(-30).reduce((a, b) => a + b, 0) / 30;
      const olderAvg = values.slice(0, -30).reduce((a, b) => a + b, 0) / 60 || 1;
      
      let trend = 'stable';
      if (recentAvg > olderAvg * 1.2) trend = 'increasing';
      else if (recentAvg < olderAvg * 0.8) trend = 'decreasing';

      const variance = values.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const confidence = Math.max(0, Math.min(100, 100 - (stdDev / (avgDaily || 1)) * 50));

      return {
        predicted_demand: predictedDemand,
        confidence: Math.round(confidence),
        trend,
        avg_daily_sales: Math.round(avgDaily * 100) / 100,
        historical_period_days: 90
      };
    } catch (error) {
      console.error('Predict demand error:', error);
      throw error;
    }
  }

  async generateReorderSuggestions() {
    try {
      const inventory = await Inventory.findAll({
        include: [{ model: Product }]
      });

      const suggestions = [];

      for (const inv of inventory) {
        const prediction = await this.predictDemand(inv.product_id);
        const safetyStock = Math.ceil(prediction.predicted_demand * 0.2);
        const reorderPoint = prediction.predicted_demand + safetyStock;

        if (inv.quantity_available < reorderPoint) {
          const suggestedQty = Math.ceil(reorderPoint * 1.5 - inv.quantity_available);
          
          let priority = 'low';
          const ratio = inv.quantity_available / (prediction.predicted_demand || 1);
          if (ratio < 0.25) priority = 'critical';
          else if (ratio < 0.5) priority = 'high';
          else if (ratio < 0.75) priority = 'medium';

          suggestions.push({
            product_id: inv.product_id,
            product_name: inv.Product?.name || 'Unknown',
            sku: inv.Product?.sku || 'N/A',
            current_stock: inv.quantity_available,
            predicted_demand: prediction.predicted_demand,
            safety_stock: safetyStock,
            reorder_point: reorderPoint,
            suggested_order_quantity: suggestedQty,
            priority,
            trend: prediction.trend,
            days_until_stockout: prediction.avg_daily_sales > 0 
              ? Math.ceil(inv.quantity_available / prediction.avg_daily_sales) 
              : Infinity
          });
        }
      }

      suggestions.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      return { suggestions, total_count: suggestions.length };
    } catch (error) {
      console.error('Generate reorder suggestions error:', error);
      throw error;
    }
  }

  async prioritizeOrders() {
    try {
      const orders = await SalesOrder.findAll({
        where: { status: 'pending' },
        include: [
          { model: Customer },
          { model: SalesOrderItem, include: [{ model: Product, include: [{ model: Inventory }] }] }
        ],
        order: [['createdAt', 'DESC']]
      });

      const prioritized = orders.map(order => {
        let score = 50;

        const orderValue = order.total_amount || 0;
        if (orderValue > 10000) score += 30;
        else if (orderValue > 5000) score += 20;
        else if (orderValue > 1000) score += 10;

        const dueDate = new Date(order.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 3) score += 30;
        else if (daysUntilDue <= 7) score += 20;
        else if (daysUntilDue <= 14) score += 10;

        const itemCount = order.SalesOrderItems?.length || 0;
        if (itemCount > 10) score += 10;
        else if (itemCount > 5) score += 5;

        let inventoryRisk = 0;
        order.SalesOrderItems?.forEach(item => {
          if (item.Product) {
            const inv = item.Product.Inventory;
            if (inv && inv.quantity_available < item.quantity) {
              inventoryRisk += 20;
            }
          }
        });
        score -= inventoryRisk;

        let priority = 'normal';
        if (score >= 80) priority = 'urgent';
        else if (score >= 60) priority = 'high';
        else if (score >= 40) priority = 'normal';
        else priority = 'low';

        return {
          order_id: order.id,
          order_number: order.order_number,
          customer: order.Customer?.company_name || 'N/A',
          total_amount: orderValue,
          due_date: order.due_date,
          days_until_due: daysUntilDue,
          ai_score: Math.max(0, Math.min(100, score)),
          priority,
          inventory_risk: inventoryRisk > 0 ? 'High' : 'Low'
        };
      });

      prioritized.sort((a, b) => b.ai_score - a.ai_score);

      return { orders: prioritized, total_count: prioritized.length };
    } catch (error) {
      console.error('Prioritize orders error:', error);
      throw error;
    }
  }

  async getInventoryHealth() {
    try {
      const inventory = await Inventory.findAll({
        include: [{ model: Product }]
      });

      const alerts = [];
      let totalValue = 0;
      let lowStockCount = 0;
      let overstockCount = 0;
      let healthyCount = 0;

      for (const inv of inventory) {
        const prediction = await this.predictDemand(inv.product_id);
        const daysOfStock = prediction.avg_daily_sales > 0 
          ? inv.quantity_available / prediction.avg_daily_sales 
          : Infinity;

        const productValue = (inv.quantity_on_hand || 0) * (inv.Product?.cost_price || 0);
        totalValue += productValue;

        if (inv.quantity_available <= 0) {
          alerts.push({
            type: 'out_of_stock',
            severity: 'critical',
            product: inv.Product?.name,
            message: `${inv.Product?.name} is out of stock`,
            recommended_action: 'Create purchase order immediately'
          });
          lowStockCount++;
        } else if (daysOfStock < 7) {
          alerts.push({
            type: 'low_stock',
            severity: 'high',
            product: inv.Product?.name,
            message: `${inv.Product?.name} has only ${Math.ceil(daysOfStock)} days of stock`,
            recommended_action: 'Reorder soon'
          });
          lowStockCount++;
        } else if (daysOfStock > 180) {
          alerts.push({
            type: 'overstock',
            severity: 'medium',
            product: inv.Product?.name,
            message: `${inv.Product?.name} has ${Math.ceil(daysOfStock)} days of stock (overstock)`,
            recommended_action: 'Consider reducing future orders'
          });
          overstockCount++;
        } else {
          healthyCount++;
        }
      }

      return {
        total_products: inventory.length,
        total_inventory_value: Math.round(totalValue * 100) / 100,
        health_summary: {
          healthy: healthyCount,
          low_stock: lowStockCount,
          overstock: overstockCount
        },
        alerts: alerts.sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        })
      };
    } catch (error) {
      console.error('Get inventory health error:', error);
      throw error;
    }
  }

  async getDashboard() {
    try {
      const [reorderSuggestions, prioritizedOrders, inventoryHealth] = await Promise.all([
        this.generateReorderSuggestions(),
        this.prioritizeOrders(),
        this.getInventoryHealth()
      ]);

      return {
        reorder_suggestions: reorderSuggestions,
        order_priorities: prioritizedOrders,
        inventory_health: inventoryHealth,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get AI dashboard error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
