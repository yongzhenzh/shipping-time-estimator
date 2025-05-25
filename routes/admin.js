import express from 'express';
import { getAllUsers } from '../db/authDAL.js';
import { getAllShippingRecords } from '../db/shippingDAL.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Middleware to require admin role
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    console.warn('[ACCESS DENIED] User is not admin:', req.user);
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
// GET /admin/users - get all users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /admin/shipping-records - all shipping history
router.get('/shipping-records', verifyToken, isAdmin, async (req, res) => {
  try {
    const records = await getAllShippingRecords(); 
    res.json(records);
  } catch (err) {
    console.error('Failed to fetch shipping records:', err);
    res.status(500).json({ error: 'Failed to fetch shipping records' });
  }
});

export default router;
