const bcrypt = require("bcrypt");
const userDAL = require("../db/authDAL");

(async () => {
  const email = "admin@example.com";
  const password = "admin123";

  try {
    const existing = await userDAL.findUserByEmail(email);
    if (existing) {
      console.log(` User already exists: ${existing.email}`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await userDAL.createAdminUser(email, hashed);
    console.log(" Admin created:", { id: admin.id, email: admin.email, role: admin.role });
  } catch (err) {
    console.error(" Error creating admin:", err);
  }
})();
