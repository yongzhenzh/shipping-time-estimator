import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";

vi.mock("../db/addressDAL.js", () => {
	return {
		saveAddress: vi.fn(),
		deleteAddress: vi.fn(),
		getSavedAddresses: vi.fn(),
	};
});

vi.mock("./auth.js", () => {
	return {
		verifyToken: (req, res, next) => {
			req.user = { id: "test-user-id" };
			next();
		},
	};
});

import {
	saveAddress,
	deleteAddress,
	getSavedAddresses,
} from "../db/addressDAL.js";
import addressesRouter from "./addresses.js";

describe("Address Routes", () => {
	let app;

	beforeEach(() => {
		vi.clearAllMocks();

		// Create a fresh Express app for each test
		app = express();
		app.use(express.json());
		app.use("/api/addresses", addressesRouter);
	});

	describe("POST /", () => {
		it("should save a new address successfully", async () => {
			const testAddress = "123 Test Street, Test City";
			const savedAddress = {
				id: 1,
				user_id: "test-user-id",
				address: testAddress,
			};

			saveAddress.mockResolvedValue(savedAddress);

			const response = await request(app)
				.post("/api/addresses")
				.set("Authorization", "Bearer fake-token")
				.send({ address: testAddress });

			expect(response.status).toBe(200);
			expect(saveAddress).toHaveBeenCalledWith("test-user-id", testAddress);
			expect(response.body).toEqual({
				message: "Address saved",
				address: savedAddress,
			});
		});

		it("should return 400 if address is missing", async () => {
			const response = await request(app)
				.post("/api/addresses")
				.set("Authorization", "Bearer fake-token")
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.error).toBe("Address is required");
		});
	});

	describe("GET /", () => {
		it("should return all saved addresses for the user", async () => {
			const savedAddresses = [
				{ id: 1, address: "123 Test Street, Test City" },
				{ id: 2, address: "456 Another St, Other City" },
			];

			getSavedAddresses.mockResolvedValue(savedAddresses);

			const response = await request(app)
				.get("/api/addresses")
				.set("Authorization", "Bearer fake-token");

			expect(response.status).toBe(200);
			expect(getSavedAddresses).toHaveBeenCalledWith("test-user-id");
			expect(response.body).toEqual(savedAddresses);
		});
	});

	describe("DELETE /:id", () => {
		it("should delete an address successfully", async () => {
			const addressId = "1";
			const deletedAddress = {
				id: 1,
				user_id: "test-user-id",
				address: "123 Test Street, Test City",
			};

			deleteAddress.mockResolvedValue(deletedAddress);

			const response = await request(app)
				.delete(`/api/addresses/${addressId}`)
				.set("Authorization", "Bearer fake-token");

			expect(response.status).toBe(200);
			expect(deleteAddress).toHaveBeenCalledWith("test-user-id", addressId);
			expect(response.body).toEqual({
				message: "Address deleted",
			});
		});

		it("should return 404 if address not found", async () => {
			deleteAddress.mockResolvedValue(null);

			const response = await request(app)
				.delete("/api/addresses/999")
				.set("Authorization", "Bearer fake-token");

			expect(response.status).toBe(404);
			expect(response.body.error).toBe("Address not found or not yours");
		});
	});
});
