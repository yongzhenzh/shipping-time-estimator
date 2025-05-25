import db from "./db.js";

// Save a new address or update existing
async function saveAddress(userId, address) {
	const result = await db.query(
		`INSERT INTO saved_addresses (user_id, address)
       VALUES ($1, $2)
       ON CONFLICT (user_id, address)
       DO NOTHING
       RETURNING *`,
		[userId, address],
	);
	return result.rows[0];
}

// Delete a saved address by ID
async function deleteAddress(userId, addressId) {
	const result = await db.query(
		"DELETE FROM saved_addresses WHERE id = $1 AND user_id = $2 RETURNING *",
		[addressId, userId],
	);
	return result.rows[0]; // returns undefined if no match
}

// Get all saved addresses for a user
async function getSavedAddresses(userId) {
	const result = await db.query(
		"SELECT id, address FROM saved_addresses WHERE user_id = $1 ORDER BY id ASC",
		[userId],
	);
	return result.rows;
}

export { saveAddress, getSavedAddresses, deleteAddress };
