// Database connection configuration
import pool, { query } from "./db.js";

// INSERT new shipping record
async function addShippingRecord(data) {
	try {
		console.log('Adding shipping record:', data);
		const {
			user_id,
			sender_name,
			recipient_name,
			zip_from,
			zip_to,
			distance,
			zone,
			occasion,
			ordered_date,
			delivery_date,
			shipping_method,
		} = data;

		const queryText = `
		INSERT INTO shipping_records
		(user_id, sender_name, recipient_name, zip_from, zip_to, distance, zone, occasion, ordered_date, delivery_date, shipping_method)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING *;
	`;

		const values = [
			user_id,
			sender_name,
			recipient_name,
			zip_from,
			zip_to,
			distance,
			zone,
			occasion,
			ordered_date,
			delivery_date,
			shipping_method,
		];
		
		const result = await query(queryText, values);
		console.log('Shipping record added successfully:', result.rows[0]);
		return result.rows[0]; // return the inserted row
	} catch (error) {
		console.error('Error adding shipping record:', error);
		throw error;
	}
}

// GET all shipping records
async function getAllShippingRecords() {
  try {
    const result = await pool.query(`
      SELECT sr.*, u.username 
      FROM shipping_records sr
      JOIN users u ON sr.user_id = u.id
    `);
    return result.rows;
  } catch (err) {
    console.error("Error in getAllShippingRecords:", err);
    throw err;
  }
}

// GET a shipping record by ID
async function getShippingRecordById(id) {
	try {
		console.log(`Getting shipping record with ID: ${id}`);
		const result = await query(
			"SELECT * FROM shipping_records WHERE id = $1;",
			[id]
		);
		if (result.rows.length === 0) {
			console.log(`No shipping record found with ID: ${id}`);
		} else {
			console.log(`Retrieved shipping record:`, result.rows[0]);
		}
		return result.rows[0];
	} catch (error) {
		console.error(`Error getting shipping record with ID ${id}:`, error);
		throw error;
	}
}

// DELETE a shipping record by ID
async function deleteShippingRecordById(id) {
	await pool.query("DELETE FROM shipping_records WHERE id = $1;", [id]);
	return { message: `Shipping record with ID ${id} deleted.` };
}

// UPDATE a shipping record
async function updateShippingRecord(id, updatedData) {
	const {
		sender_name,
		recipient_name,
		zip_from,
		zip_to,
		distance,
		zone,
		occasion,
		ordered_date,
		delivery_date,
		shipping_method,
	} = updatedData;

	const query = `
    UPDATE shipping_records
    SET sender_name = $1,
        recipient_name = $2,
        zip_from = $3,
        zip_to = $4,
        distance = $5,
        zone = $6,
        occasion = $7,
        ordered_date = $8,
        delivery_date = $9,
        shipping_method = $10
    WHERE id = $11
    RETURNING *;
  `;

	const values = [
		sender_name,
		recipient_name,
		zip_from,
		zip_to,
		distance,
		zone,
		occasion,
		ordered_date,
		delivery_date,
		shipping_method,
		id,
	];
	const result = await pool.query(query, values);
	return result.rows[0];
}

async function getShippingMethods() {
	return ["Standard", "Priority", "Express"];
}

export async function getAllShippingRecordsByUserId(userId) {
  const result = await query(`
    SELECT s.*, u.username
    FROM shipping_records s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.user_id = $1
    ORDER BY s.id ASC
  `, [userId]);

  return result.rows;
}
// Export all functions to be used in API routes
export {
	addShippingRecord,
	getAllShippingRecords,
	getShippingRecordById,
	deleteShippingRecordById,
	updateShippingRecord,
	getShippingMethods,
};
