const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../src/models');

dotenv.config();

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
    });

    console.log('Created admin user:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin user:', err);
    process.exit(1);
  }
}

seed();
