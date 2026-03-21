// Sun Zhiyuan Felix (A0272474Y)
// Admin user defaults for playwright tests// Centralized seeded admin defaults for isolated Playwright tests.

export const seededAdmin = Object.freeze({
  name: 'Playwright Admin',
  email: 'uitestadmin@email.com',
  password: 'password123',
  phone: '123456789',
  address: 'Playwright Test Address',
  answer: 'tennis',
  role: 1,
});