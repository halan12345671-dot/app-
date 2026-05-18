const { DataTypes } = require('sequelize');

const SalesOrderItem = {
  initModel: (sequelize) => {
    const SalesOrderItem = sequelize.define(
      'SalesOrderItem',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        sales_order_id: {
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
        discount_percent: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0,
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
        tableName: 'sales_order_items',
        timestamps: false,
      }
    );
    return SalesOrderItem;
  },
};

module.exports = SalesOrderItem;
