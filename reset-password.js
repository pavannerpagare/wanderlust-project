require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/user");

async function resetPassword() {
  const mongoUri =
    process.env.ATLASDB_URL ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URI;

  const newPassword = process.env.NEW_PASSWORD;

  if (!mongoUri) {
    throw new Error("MongoDB URI not found. Check your .env variable name.");
  }

  if (!newPassword || newPassword.length < 12) {
    throw new Error(
      "Set NEW_PASSWORD to a new password of at least 12 characters."
    );
  }

  await mongoose.connect(mongoUri);

  try {
    const user = await User.findOne({
      username: "pavannerpagare",
    });

    if (!user) {
      throw new Error("User not found.");
    }

    await user.setPassword(newPassword);
    await user.save();

    console.log("Password reset successfully.");
    console.log("Username:", user.username);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword().catch((error) => {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
});
