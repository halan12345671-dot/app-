const { DataTypes } = require('sequelize');

const PurchaseOrder = {
  initModel: (sequelize) => {
    const PurchaseOrderModel = sequelize.define(
      'PurchaseOrder',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        po_number: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        supplier_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        po_date: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        expected_delivery_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'confirmed', 'received', 'cancelled'),
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
        tableName: 'purchase_orders',
        timestamps: false,
        underscored: true,
      }
    );
    return PurchaseOrderModel;
  },
};

module.exports = PurchaseOrder;
