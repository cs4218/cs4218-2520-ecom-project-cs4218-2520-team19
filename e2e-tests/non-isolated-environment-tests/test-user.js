import userModel from '../../models/userModel.js';
import { hashPassword } from '../../helpers/authHelper.js';

const testUser = Object.freeze({
  name: 'uitest',
  email: 'uitest@email.com',
  password: 'password123',
  phone: '123456789',
  address: 'uitest address',
  answer: 'tennis',
  role: 0,
});

const adminUser = Object.freeze({
  name: 'testAdmin',
  email: 'testAdmin@email.com',
  password: 'password123',
  phone: '987654321',
  address: 'testAdmin address',
  answer: 'tennis',
  role: 1,
});


const createTestUser = async () => {
  const hashedPassword = await hashPassword(testUser.password);
  if (!await userModel.findOne({ email: testUser.email })) {
    await userModel.create({ ...testUser, password: hashedPassword });
  } else {
    await resetTestUserPassword();
  }
};

const createTestAdmin = async () => {
  const hashedPassword = await hashPassword(adminUser.password);
  if (!await userModel.findOne({ email: adminUser.email })) {
    await userModel.create({ ...adminUser, password: hashedPassword });
  }
};

const resetTestUserPassword = async () => {
  const hashedPassword = await hashPassword(testUser.password);
  await userModel.findOneAndUpdate({ email: testUser.email }, { password: hashedPassword });
};

const deleteTestUser = async () => {
  await userModel.deleteOne({ email: testUser.email });
};

export {testUser, resetTestUserPassword, createTestUser, deleteTestUser, createTestAdmin};