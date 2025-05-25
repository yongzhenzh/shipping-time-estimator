const db = require("../db/db");

(async () => {
  try {
    console.log("Adding 'role' column to users table...");
    await db.query(`
      ALTER TABLE users
      ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    `);
    console.log("Column 'role' added successfully!");
  } catch (err) {
    if (err.code === "42701") {
      console.log(" Column 'role' already exists.");
    } else {
      console.error(" Migration failed:", err);
    }
  }
})();
