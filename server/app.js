const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import routes
const campaignRoutes = require('./routes/campaigns');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'], // Ganti dengan URL frontend Anda
  credentials: true,
}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Database setup
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback', // Ganti dengan URL callback Anda
},
  (accessToken, refreshToken, profile, done) => {
    // Cari atau buat pengguna baru
    User.findOne({ googleId: profile.id }, (err, user) => {
      if (err) return done(err);
      if (user) {
        return done(null, user);
      } else {
        const newUser = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
        });
        newUser.save(err => {
          if (err) return done(err);
          return done(null, newUser);
        });
      }
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Route middleware
app.use('/campaigns', campaignRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
