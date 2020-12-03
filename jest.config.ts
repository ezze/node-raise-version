const config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts'
  ]
};

export default config;
