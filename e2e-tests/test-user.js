import dotenv from 'dotenv';
import { connectDB, disconnectDB } from "../config/db.js";
import userModel from '../models/userModel.js';
import { hashPassword } from '../helpers/authHelper.js';

dotenv.config();

const testUser = Object.freeze({
  name: 'uitest',
  email: 'uitest@email.com',
  password: 'password123',
  phone: '123456789',
  address: 'uitest address',
  answer: 'tennis',
  role: 0,
});

const createTestUser = async () => {
  await connectDB();
  const hashedPassword = await hashPassword(testUser.password);
  await new userModel({ ...testUser, password: hashedPassword }).save();
  await disconnectDB();
};

const deleteTestUser = async () => {
  await connectDB();
  await userModel.deleteOne({ email: testUser.email });
  await disconnectDB();
};

export {testUser, createTestUser, deleteTestUser};