import express from "express";
const router = express.Router();
import { verifyToken } from "./auth.js";
import {
	saveAddress,
	getSavedAddresses,
	deleteAddress,
} from "../db/addressDAL.js";

// Save a new address
router.post("/", verifyToken, async (req, res) => {
	const { address } = req.body;
	if (!address) return res.status(400).json({ error: "Address is required" });

	try {
		const saved = await saveAddress(req.user.id, address);
		res.json({ message: "Address saved", address: saved });
	} catch (err) {
		console.error("Error saving address:", err);
		res.status(500).json({ error: "Failed to save address" });
	}
});

// Delete a saved address by ID
router.delete("/:id", verifyToken, async (req, res) => {
	const addressId = req.params.id;

	try {
		const deleted = await deleteAddress(req.user.id, addressId);
		if (!deleted) {
			return res.status(404).json({ error: "Address not found or not yours" });
		}
		res.json({ message: "Address deleted" });
	} catch (err) {
		console.error("Error deleting address:", err);
		res.status(500).json({ error: "Failed to delete address" });
	}
});

// Get saved addresses
router.get("/", verifyToken, async (req, res) => {
	try {
		const addresses = await getSavedAddresses(req.user.id);
		res.json(addresses);
	} catch (err) {
		console.error("Error fetching addresses:", err);
		res.status(500).json({ error: "Failed to fetch addresses" });
	}
});

export default router;
