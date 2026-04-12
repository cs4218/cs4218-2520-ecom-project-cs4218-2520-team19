export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/*/*.test.js", "<rootDir>/non-functional-tests/**/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};
