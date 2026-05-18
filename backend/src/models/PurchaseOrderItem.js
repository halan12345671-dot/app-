const { DataTypes } = require('sequelize');

const PurchaseOrderItem = {
  initModel: (sequelize) => {
    const PurchaseOrderItem = sequelize.define(
      'PurchaseOrderItem',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        purchase_order_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        product_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        unit_price: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
        },
        line_total: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: 'purchase_order_items',
        timestamps: false,
      }
    );
    return PurchaseOrderItem;
  },
};

module.exports = PurchaseOrderItem;
