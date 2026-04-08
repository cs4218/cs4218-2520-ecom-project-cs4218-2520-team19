export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/*/*.test.js"],

  // keep backend coverage separate so frontend runs do not overwrite it
  coverageDirectory: "<rootDir>/coverage/backend",

  // jest code coverage
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};
