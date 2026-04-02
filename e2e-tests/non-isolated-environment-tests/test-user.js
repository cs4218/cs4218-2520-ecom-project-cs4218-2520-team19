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

const createTestUser = async () => {
  const hashedPassword = await hashPassword(testUser.password);
  if (!await userModel.findOne({ email: testUser.email })) {
    await userModel.create({ ...testUser, password: hashedPassword });
  } else {
    await resetTestUserPassword();
  }
};

const resetTestUserPassword = async () => {
  const hashedPassword = await hashPassword(testUser.password);
  await userModel.findOneAndUpdate({ email: testUser.email }, { password: hashedPassword });
};

const deleteTestUser = async () => {
  await userModel.deleteOne({ email: testUser.email });
};

export {testUser, resetTestUserPassword, createTestUser, deleteTestUser};