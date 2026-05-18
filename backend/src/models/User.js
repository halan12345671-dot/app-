const { DataTypes } = require('sequelize');

const User = {
  initModel: (sequelize) => {
    const User = sequelize.define(
      'User',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        first_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM('admin', 'manager', 'staff'),
          defaultValue: 'staff',
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
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
        tableName: 'users',
        timestamps: false,
      }
    );
    return User;
  },
};

module.exports = User;
