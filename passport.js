const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Backend/Modals/UserSign'); // Your Mongoose User Model
const jwt = require('jsonwebtoken');

const router = express.Router();

// Helper to generate your JWT token
const generateJWT = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in MongoDB
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Create user if they don't exist
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          isVerified: true
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// 1. Trigger Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google Callback Handler
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = generateJWT(req.user); 
    
    // Dynamically choose frontend URL (Vercel for production, Localhost for dev)
    const frontendURL = process.env.NODE_ENV === 'production' 
      ? 'https://aireasetravelstours.vercel.app' 
      : 'http://localhost:3000';
    
    // Redirect back to your frontend with the token
    res.redirect(`${frontendURL}/auth-success?token=${token}`);
  }
);

module.exports = router;