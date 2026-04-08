import userModel from '../../models/userModel.js';
import { hashPassword } from '../../helpers/authHelper.js';

const testUser = Object.freeze({
  name: 'uitest',
  email: 'uitest@email.com',
  password: 'StrongPassword123!',
  phone: '123456789',
  address: 'uitest address',
  answer: 'tennis',
  role: 0,
});

const adminUser = Object.freeze({
  name: 'testAdmin',
  email: 'testAdmin@email.com',
  password: 'StrongPassword123!',
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
    await resetPassword(testUser);
  }
};

const createTestAdmin = async () => {
  const hashedPassword = await hashPassword(adminUser.password);
  if (!await userModel.findOne({ email: adminUser.email })) {
    await userModel.create({ ...adminUser, password: hashedPassword });
  } else {
    await resetPassword(adminUser);
  }
};

const resetPassword = async (user) => {
  const hashedPassword = await hashPassword(user.password);
  await userModel.findOneAndUpdate({ email: user.email }, { password: hashedPassword });
};

const deleteTestUser = async () => {
  await userModel.deleteOne({ email: testUser.email });
};

export {testUser, resetPassword, createTestUser, deleteTestUser, createTestAdmin};