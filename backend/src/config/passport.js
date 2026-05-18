const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const profileEmail =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;

        if (!profileEmail) {
          return done(
            new Error('No email found in Google profile'),
            null
          );
        }

        // Tìm user đã tồn tại theo email
        let user = await User.findOne({ where: { email: profileEmail } });

        if (!user) {
          // Đăng ký mới từ Google profile
          const displayName = profile.displayName || profileEmail.split('@')[0];
          const names = displayName.split(' ');
          const randomPassword = await bcrypt.hash(
            'google_' + uuidv4(),
            10
          );

          user = await User.create({
            email: profileEmail,
            password: randomPassword,
            first_name: names[0] || '',
            last_name: names.slice(1).join(' ') || profileEmail.split('@')[0],
            role: 'user',
          });
        }

        // Tạo JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return done(null, {
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
          },
        });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Không dùng session (stateless JWT)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;