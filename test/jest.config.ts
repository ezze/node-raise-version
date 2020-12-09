const config = {
  rootDir: '../',
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],
  testEnvironment: 'node',
  preset: 'ts-jest',
  globalSetup: '<rootDir>/test/globalSetup.ts'
};

export default config;
