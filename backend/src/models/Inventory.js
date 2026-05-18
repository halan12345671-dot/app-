const { DataTypes } = require('sequelize');

const Inventory = {
  initModel: (sequelize) => {
    const Inventory = sequelize.define(
      'Inventory',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        product_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        quantity_on_hand: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        quantity_reserved: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        quantity_available: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        warehouse_location: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        last_counted_at: {
          type: DataTypes.DATE,
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
        tableName: 'inventory',
        timestamps: false,
      }
    );
    return Inventory;
  },
};

module.exports = Inventory;
