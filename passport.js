import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './Modals/UserSign.js'; // Ensure .js extension is included for ES modules
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateJWT = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
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

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateJWT(req.user); 
    const frontendURL = process.env.NODE_ENV === 'production' 
      ? 'https://aireasetravelstours.vercel.app' 
      : 'http://localhost:3000';
    
    res.redirect(`${frontendURL}/auth-success?token=${token}`);
  }
);

export default router;