const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Allow using SQLite for local development to avoid requiring PostgreSQL.
// Set USE_SQLITE=true in environment to use SQLite, otherwise use Postgres.
let sequelize;
const useSqliteEnv = process.env.USE_SQLITE ? process.env.USE_SQLITE.trim().toLowerCase() : '';
const useSqlite = useSqliteEnv === 'true' || process.env.NODE_ENV === 'development';
if (useSqlite) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || 'database.sqlite',
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  );
}

// Import model definitions (each exports an initModel function)
const UserDef = require('./User');
const CustomerDef = require('./Customer');
const ProductDef = require('./Product');
const InventoryDef = require('./Inventory');
const SalesOrderDef = require('./SalesOrder');
const SalesOrderItemDef = require('./SalesOrderItem');
const PurchaseOrderDef = require('./PurchaseOrder');
const PurchaseOrderItemDef = require('./PurchaseOrderItem');

// Initialize models and capture the returned Sequelize model objects
const User = UserDef.initModel(sequelize);
const Customer = CustomerDef.initModel(sequelize);
const Product = ProductDef.initModel(sequelize);
const Inventory = InventoryDef.initModel(sequelize);
const SalesOrder = SalesOrderDef.initModel(sequelize);
const SalesOrderItem = SalesOrderItemDef.initModel(sequelize);
const PurchaseOrder = PurchaseOrderDef.initModel(sequelize);
const PurchaseOrderItem = PurchaseOrderItemDef.initModel(sequelize);

// Define associations using the actual Sequelize model instances
Customer.hasMany(SalesOrder, { foreignKey: 'customer_id' });
SalesOrder.belongsTo(Customer, { foreignKey: 'customer_id' });

SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'sales_order_id' });
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });

Product.hasMany(SalesOrderItem, { foreignKey: 'product_id' });
SalesOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

Product.hasOne(Inventory, { foreignKey: 'product_id' });
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  sequelize,
  User,
  Customer,
  Product,
  Inventory,
  SalesOrder,
  SalesOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
};
