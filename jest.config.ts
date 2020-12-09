const config = {
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],
  testEnvironment: 'node',
  preset: 'ts-jest',
  globalSetup: '<rootDir>/test/globalSetup.ts'
};

if (process.env.COVERAGE) {
  Object.assign(config, {
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.ts'
    ],
    coverageDirectory: '<rootDir>/coverage'
  });
}

export default config;
