import dotenv from 'dotenv';
import { connectDB, disconnectDB } from "../../config/db.js";
import { deleteTestUser } from "./test-user.js";
import { deleteTestData } from "./test-products.js";

dotenv.config();

const unseed = async () => {
  await connectDB();
  await deleteTestUser();
  await deleteTestData();
  await disconnectDB();
};

unseed()
  .then(() => {
    console.log("UnSeeding complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("UnSeeding failed:", err);
    process.exit(1);
  });