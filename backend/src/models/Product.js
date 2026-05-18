const { DataTypes } = require('sequelize');

const Product = {
  initModel: (sequelize) => {
    const Product = sequelize.define(
      'Product',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        sku: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        unit_price: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
        },
        cost_price: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
        },
        unit: {
          type: DataTypes.STRING,
          defaultValue: 'piece',
        },
        reorder_level: {
          type: DataTypes.INTEGER,
          defaultValue: 10,
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
          defaultValue: 'active',
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
        tableName: 'products',
        timestamps: false,
      }
    );
    return Product;
  },
};

module.exports = Product;
