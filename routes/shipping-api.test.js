import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";

vi.mock("../db/shippingDAL.js", () => {
	return {
		addShippingRecord: vi.fn(),
		getAllShippingRecords: vi.fn(),
		getShippingRecordById: vi.fn(),
		deleteShippingRecordById: vi.fn(),
		updateShippingRecord: vi.fn(),
	};
});

import {
	addShippingRecord,
	getAllShippingRecords,
	getShippingRecordById,
	deleteShippingRecordById,
	updateShippingRecord,
} from "../db/shippingDAL.js";
import shippingApiRouter from "./shipping-api.js";

describe("Shipping API Routes", () => {
	let app;

	beforeEach(() => {
		vi.clearAllMocks();
		app = express();
		app.use(express.json());
		app.use("/api/shipping", shippingApiRouter);
	});

	describe("GET /", () => {
		it("should return all shipping records", async () => {
			const shippingRecords = [
				{
					id: 1,
					origin: "New York",
					destination: "Los Angeles",
					status: "Delivered",
				},
				{
					id: 2,
					origin: "Chicago",
					destination: "Miami",
					status: "In Transit",
				},
			];

			getAllShippingRecords.mockResolvedValue(shippingRecords);

			const response = await request(app).get("/api/shipping");

			expect(response.status).toBe(200);
			expect(getAllShippingRecords).toHaveBeenCalled();
			expect(response.body).toEqual(shippingRecords);
		});

		it("should handle errors when fetching all records", async () => {
			getAllShippingRecords.mockRejectedValue(new Error("Database error"));

			const response = await request(app).get("/api/shipping");

			expect(response.status).toBe(500);
			expect(response.body.error).toBe("Database error");
		});
	});

	describe("GET /:id", () => {
		it("should return a shipping record by ID", async () => {
			const recordId = 1;
			const shippingRecord = {
				id: recordId,
				origin: "New York",
				destination: "Los Angeles",
				status: "Delivered",
			};

			getShippingRecordById.mockResolvedValue(shippingRecord);

			const response = await request(app).get(`/api/shipping/${recordId}`);

			expect(response.status).toBe(200);
			expect(getShippingRecordById).toHaveBeenCalledWith(recordId);
			expect(response.body).toEqual(shippingRecord);
		});

		it("should return 404 if shipping record is not found", async () => {
			getShippingRecordById.mockResolvedValue(null);

			const response = await request(app).get("/api/shipping/999");

			expect(response.status).toBe(404);
			expect(response.body.error).toBe("Shipping record not found");
		});

		it("should handle errors when fetching a record", async () => {
			getShippingRecordById.mockRejectedValue(new Error("Database error"));

			const response = await request(app).get("/api/shipping/1");

			expect(response.status).toBe(500);
			expect(response.body.error).toBe("Database error");
		});
	});

	describe("POST /", () => {
		it("should create a new shipping record", async () => {
			const newRecordData = {
				origin: "Boston",
				destination: "Seattle",
				status: "Processing",
			};

			const createdRecord = {
				id: 3,
				...newRecordData,
				created_at: "2023-05-15T10:30:00Z",
			};

			addShippingRecord.mockResolvedValue(createdRecord);

			const response = await request(app)
				.post("/api/shipping")
				.send(newRecordData);

			expect(response.status).toBe(201);
			expect(addShippingRecord).toHaveBeenCalledWith(newRecordData);
			expect(response.body).toEqual(createdRecord);
		});

		it("should handle errors when creating a record", async () => {
			addShippingRecord.mockRejectedValue(new Error("Validation error"));

			const response = await request(app).post("/api/shipping").send({});

			expect(response.status).toBe(500);
			expect(response.body.error).toBe("Validation error");
		});
	});

	describe("PUT /:id", () => {
		it("should update a shipping record", async () => {
			const recordId = 2;
			const updateData = {
				status: "Delivered",
				delivery_date: "2023-05-16T14:25:00Z",
			};

			const updatedRecord = {
				id: recordId,
				origin: "Chicago",
				destination: "Miami",
				status: "Delivered",
				delivery_date: "2023-05-16T14:25:00Z",
			};

			updateShippingRecord.mockResolvedValue(updatedRecord);

			const response = await request(app)
				.put(`/api/shipping/${recordId}`)
				.send(updateData);

			expect(response.status).toBe(200);
			expect(updateShippingRecord).toHaveBeenCalledWith(recordId, updateData);
			expect(response.body).toEqual(updatedRecord);
		});

		it("should handle errors when updating a record", async () => {
			updateShippingRecord.mockRejectedValue(new Error("Record not found"));

			const response = await request(app)
				.put("/api/shipping/999")
				.send({ status: "Delivered" });

			expect(response.status).toBe(500);
			expect(response.body.error).toBe("Record not found");
		});
	});

	describe("DELETE /:id", () => {
		it("should delete a shipping record", async () => {
			const recordId = 1;
			const deletionResult = { deleted: true, id: recordId };

			deleteShippingRecordById.mockResolvedValue(deletionResult);

			const response = await request(app).delete(`/api/shipping/${recordId}`);

			expect(response.status).toBe(200);
			expect(deleteShippingRecordById).toHaveBeenCalledWith(recordId);
			expect(response.body).toEqual(deletionResult);
		});

		it("should handle errors when deleting a record", async () => {
			deleteShippingRecordById.mockRejectedValue(new Error("Record not found"));

			const response = await request(app).delete("/api/shipping/999");

			expect(response.status).toBe(500);
			expect(response.body.error).toBe("Record not found");
		});
	});
});
