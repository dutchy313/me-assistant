import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";
import { USER_ROLES } from "../constants/roles.js";

async function makeReviewer() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email address.");
    console.error("Example:");
    console.error("npm run make:reviewer -- user@example.com");
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOneAndUpdate(
    {
      email: email.toLowerCase().trim()
    },
    {
      role: USER_ROLES.REVIEWER
    },
    {
    returnDocument: "after",
    runValidators: true
    }
  );

  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Reviewer role assigned successfully.`);
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);

  await mongoose.disconnect();
  process.exit(0);
}

makeReviewer().catch(async (error) => {
  console.error("Could not assign reviewer role.");
  console.error(error.message);

  await mongoose.disconnect();
  process.exit(1);
});