const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const Users = require("./models/users");

const router = express.Router();

const SECRET = process.env.JWT_SECRET || "secretkey";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const GOOGLE_CALLBACK_URL = process.env.CALLBACK_URL || "http://localhost:5001/auth/google/callback";

// --- Session setup (required for passport) ---
router.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

router.use(passport.initialize());
router.use(passport.session());

// --- Passport serialization ---
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// --- Google OAuth strategy ---
passport.use(
  new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await Users.findByGoogleId(profile.id);

        if (!user) {
          user = await Users.createUser({
            username: profile.emails[0].value,
            googleId: profile.id,
            role: "user",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// --- OAuth Routes ---
// Step 1: start login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// // Step 2: callback from Google
// router.get(
//   "/google/callback",
//   passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
//   (req, res) => {
//     // Issue a JWT instead of relying only on session cookies
//     const token = jwt.sign(
//       { username: req.user.username, role: req.user.role },
//       SECRET,
//       { expiresIn: "1h" }
//     );

//     // Redirect to frontend with token
//     res.redirect(`http://localhost:3000/status?token=${token}`);
//   }
// );
// Step 2: callback from Google
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    const token = jwt.sign(
      { username: req.user.username, role: req.user.role },
      SECRET,
      { expiresIn: "1h" }
    );

    // Redirect to frontend with token + username + role
    res.redirect(
      `${FRONTEND_URL}/status?token=${token}&username=${encodeURIComponent(
        req.user.username
      )}&role=${req.user.role}`
    );

  }
);

// Step 3: expose current user
router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Step 4: logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(`${FRONTEND_URL}/login`);
  });
});

module.exports = router;
