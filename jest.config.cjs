module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  testMatch: [
    "<rootDir>/src/__tests__/**/*.test.ts", 
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  preset: "ts-jest",
  testEnvironmentOptions: {
    url: "http://localhost"
  }
};
