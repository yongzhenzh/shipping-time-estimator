import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
	user: "zhangyongzhen99",
	host: "localhost",
	database: "shipping_db",
	password: "CS5610",
	port: 5432,
});

// Add event listeners to the pool for better debugging
pool.on('connect', () => {
	console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
	console.error('Unexpected error on idle PostgreSQL client', err);
	process.exit(-1);
});

// Add a query wrapper function with logging
const query = async (text, params) => {
	try {
		console.log('Executing query:', { text, params });
		const start = Date.now();
		const res = await pool.query(text, params);
		const duration = Date.now() - start;
		console.log('Executed query:', { text, duration, rows: res.rowCount });
		return res;
	} catch (error) {
		console.error('Query error:', { text, error });
		throw error;
	}
};

export { query };
export default pool;
