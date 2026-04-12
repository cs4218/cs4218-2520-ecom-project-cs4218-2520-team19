import dotenv from 'dotenv'
import { connectDB, disconnectDB } from "../../config/db.js";
import { createTestUser, createTestAdmin } from "./test-user.js";
import { createTestData } from "./test-products.js";

dotenv.config()

const seed = async () => {
  await connectDB();
  await createTestUser();
  await createTestAdmin();
  await createTestData();
  await disconnectDB();
};

seed()
  .then(() => {
    console.log("Seeding complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });