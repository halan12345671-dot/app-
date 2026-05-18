const { DataTypes } = require('sequelize');

const Customer = {
  initModel: (sequelize) => {
    const Customer = sequelize.define(
      'Customer',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        company_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        contact_person: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        tax_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        credit_limit: {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive', 'suspended'),
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
        tableName: 'customers',
        timestamps: false,
      }
    );
    return Customer;
  },
};

module.exports = Customer;
