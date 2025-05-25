import db from "./db.js";

async function createUser(username, email, hashedPassword) {
  const result = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [username, email, hashedPassword]
  );
  return result.rows[0];
}

async function getAllUsers() {
  const result = await db.query(
    "SELECT id, username, email, role FROM users ORDER BY id ASC"
  );
  return result.rows;
}

async function findUserByUsernameOrEmail(username, email) {
  const result = await db.query(
    "SELECT * FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );
  return result.rows[0];
}

 async function createAdminUser(username, email, hashedPassword) {
  const result = await db.query(
    "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING *",
    [username, email, hashedPassword]
  );
  return result.rows[0];
}


export {
  createUser,
  createAdminUser,
  findUserByUsernameOrEmail,
  getAllUsers,

};
