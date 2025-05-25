const bcrypt = require("bcrypt");
const userDAL = require("../db/authDAL");

(async () => {
  const email = "admin@example.com";
  const password = "admin123";

  try {
    console.log(" Deleting existing user if any...");
    await userDAL.deleteUserByEmail(email);

    const hashed = await bcrypt.hash(password, 10);
    const user = await userDAL.createAdminUser(email, hashed);

    console.log(" Admin re-created:", {
      id: user.id,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error(" Error resetting admin:", err);
  }
})();
