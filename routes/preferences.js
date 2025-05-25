import express from "express";
import { verifyToken } from "./auth.js";
import * as preferencesDAL from "../db/preferencesDAL.js";
import db from "../db/db.js";
const router = express.Router();

// POST /preferences - Save a new preference
router.post("/", verifyToken, async (req, res) => {
	const { recipient, occasion } = req.body;
	if (!recipient || !occasion) {
		return res
			.status(400)
			.json({ error: "Recipient and occasion are required." });
	}

	try {
		const pref = await preferencesDAL.savePreference(
			req.user.id,
			recipient,
			occasion,
		);
		res.json(pref);
	} catch (err) {
		console.error("Error saving preference:", err);
		res.status(500).json({ error: "Failed to save preference" });
	}
});

// GET /preferences - List current user's preferences
router.get("/", verifyToken, async (req, res) => {
	try {
		const prefs = await preferencesDAL.getPreferencesByUser(req.user.id);
		res.json(prefs);
	} catch (err) {
		console.error("Error fetching preferences:", err);
		res.status(500).json({ error: "Failed to fetch preferences" });
	}
});

export default router;
