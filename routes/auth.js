import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { saveAddress, getSavedAddresses } from "../db/addressDAL.js";
import { createUser, findUserByUsernameOrEmail, getAllUsers } from "../db/authDAL.js";
import { createAdminUser } from '../db/authDAL.js';


const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "dev-secret";


function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    console.warn('[ACCESS DENIED] User is not admin:', req.user);
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}


// Verify JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err){
		console.warn("JWT verification failed:", err.message);
		return res.status(403).json({ error: 'Invalid token' });
	} 

    req.user = user; 
    next();
  });
}

// create an admin
router.post("/create-admin", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields (username, email, password) are required." });
  }

  try {
    const existingUser = await findUserByUsernameOrEmail(username, email);
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await createAdminUser(username, email, hashedPassword);

    res.status(201).json({ message: "Admin user created", user: {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    }});
  } catch (err) {
    console.error("Error creating admin user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Save an address
router.post("/addresses", verifyToken, async (req, res) => {
	const { address } = req.body;
	if (!address) {
		return res.status(400).json({ error: "Address are required" });
	}

	try {
		const saved = await saveAddress(req.user.id, label, address);
		res.json({ message: "Address saved", address: saved });
	} catch (err) {
		console.error("Save address error:", err);
		res.status(500).json({ error: "Failed to save address" });
	}
});

// Get saved addresses
router.get("/addresses", verifyToken, async (req, res) => {
	try {
		const addresses = await getSavedAddresses(req.user.id);
		res.json(addresses);
	} catch (err) {
		console.error("Get addresses error:", err);
		res.status(500).json({ error: "Failed to fetch addresses" });
	}
});


// List Users (admin only)
router.get("/admin/users", verifyToken, isAdmin, async (req, res) => {
	console.log("User in /admin/users:", req.user);
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).send("Error fetching users");
  }
});

// get all sihpping-records (admin)
router.get("/admin/shipping-records", verifyToken, isAdmin, async (req, res) => {
  const records = await getAllShippingRecords();
  res.json(records);
});

// Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required." });

  try {
    const existing = await findUserByUsername(username);
    if (existing)
      return res.status(400).json({ error: "Username already taken." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(username, email, hashed);
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await findUserByUsernameOrEmail(username, username);
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: "1h" }
    );

    // Return token + user
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login error" });
  }
});

// Logout
router.post("/logout", verifyToken, (req, res) => {
	res.json({ message: "Successfully logged out on client." });
});

export { router, verifyToken };
