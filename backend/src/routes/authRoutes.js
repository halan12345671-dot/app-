const express = require('express');
const passport = require('passport');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validate, registerSchema, loginSchema } = require('../validators/schemas');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      id: uuidv4(),
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role: 'admin',
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({ message: 'User registered successfully', user: userResponse });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({ message: 'Login successful', token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get(
  '/google/callback',
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || 
      (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN.split(',')[0].trim() : 'http://localhost:3000');
    passport.authenticate('google', {
      failureRedirect: `${frontendUrl}/login?error=google_auth_failed`,
      session: false,
    })(req, res, next);
  },
  (req, res) => {
    const { token, user } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 
      (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN.split(',')[0].trim() : 'http://localhost:3000');
    const redirectURL = `${frontendUrl}/login?token=${token}&email=${encodeURIComponent(user.email)}&first_name=${encodeURIComponent(user.first_name)}&last_name=${encodeURIComponent(user.last_name)}&role=${user.role}`;
    res.redirect(redirectURL);
  }
);

router.get('/google/fail', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Error fetching user info', error: error.message });
  }
});

module.exports = router;
