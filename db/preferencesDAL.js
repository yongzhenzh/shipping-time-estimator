import db from "./db.js";

async function savePreference(userId, recipient, occasion) {
	const result = await db.query(
		`INSERT INTO preferences (user_id, recipient, occasion)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, recipient, occasion)
     DO UPDATE SET recipient = EXCLUDED.recipient
     RETURNING *`,
		[userId, recipient, occasion],
	);
	return result.rows[0];
}

async function getPreferencesByUser(userId) {
	const result = await db.query(
		`SELECT recipient, occasion FROM preferences WHERE user_id = $1`,
		[userId],
	);
	return result.rows;
}

export { savePreference, getPreferencesByUser };
