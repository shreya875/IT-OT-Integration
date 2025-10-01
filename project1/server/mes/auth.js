const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("./models/users");

const SECRET = process.env.JWT_SECRET || "secretkey";

async function register(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await Users.findOne({ username });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await Users.createUser({ username, passwordHash: hashed, role });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await Users.findOne({ username });
    // Ensure we only attempt compare when a valid string hash is present (local accounts only)
    if (!user || typeof user.passwordHash !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ error: "Login failed" });
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
}

module.exports = { register, login, authMiddleware };
