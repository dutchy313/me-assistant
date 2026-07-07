import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email.");
    console.error("Example: npm run make:admin -- user@example.com");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = "admin";
  await user.save();

  console.log(`${email} is now an admin.`);

  await mongoose.disconnect();
}

makeAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});