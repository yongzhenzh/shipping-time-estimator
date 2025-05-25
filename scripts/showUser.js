const userDAL = require("../db/authDAL");

(async () => {
  const email = "admin@example.com";

  try {
    const user = await userDAL.findUserByEmail(email);
    if (!user) {
      console.log(" No user found");
    } else {
      console.log(" User found:");
      console.log({
        id: user.id,
        email: user.email,
        role: user.role
      });
    }
  } catch (err) {
    console.error(" Error fetching user:", err);
  }
})();
