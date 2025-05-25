import express from "express";
const router = express.Router();
import {
	addShippingRecord,
	getAllShippingRecords,
	getShippingRecordById,
	deleteShippingRecordById,
	updateShippingRecord,
} from "../db/shippingDAL.js";

const app = express();
app.use(express.json());

const PORT = 3000;

// GET all shipping records
router.get("/", async (req, res) => {
	try {
		const records = await getAllShippingRecords();
		res.json(records);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET a shipping record by ID
router.get("/:id", async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const record = await getShippingRecordById(id);
		if (record) {
			res.json(record);
		} else {
			res.status(404).json({ error: "Shipping record not found" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// POST to add a new shipping record
router.post("/", async (req, res) => {
	try {
		const newRecord = await addShippingRecord(req.body);
		res.status(201).json(newRecord);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// PUT to update a shipping record
router.put("/:id", async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const updatedRecord = await updateShippingRecord(id, req.body);
		res.json(updatedRecord);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// DELETE a shipping record
router.delete("/:id", async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const result = await deleteShippingRecordById(id);
		res.json(result);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

export default router;
