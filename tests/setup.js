// test/setup.js
import { beforeAll, afterAll, afterEach, vi } from "vitest";

// Mock JWT for authentication
vi.mock("jsonwebtoken", () => ({
	default: {
		sign: vi.fn().mockReturnValue("test-token"),
		verify: vi
			.fn()
			.mockReturnValue({ id: "test-user-id", email: "test@example.com" }),
	},
}));

// Setup database mocks if needed
vi.mock("../db/db", () => ({
	query: vi.fn(),
	close: vi.fn(),
}));

// Global setup for all tests
beforeAll(() => {
	// Setup any global test environment needs here
	console.log("Test suite started");
});

// Clean up after each test
afterEach(() => {
	vi.clearAllMocks();
});

// Global teardown
afterAll(() => {
	// Clean up any resources
	console.log("Test suite completed");
});
