const { DataTypes } = require('sequelize');

const SalesOrder = {
  initModel: (sequelize) => {
    const SalesOrder = sequelize.define(
      'SalesOrder',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        order_number: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        customer_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        order_date: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        due_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
          defaultValue: 'pending',
        },
        total_amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
        },
        tax_amount: {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0,
        },
        discount_amount: {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
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
        tableName: 'sales_orders',
        timestamps: false,
      }
    );
    return SalesOrder;
  },
};

module.exports = SalesOrder;
