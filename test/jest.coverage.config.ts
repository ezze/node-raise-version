import basicConfig from './jest.config';

const config = {
  ...basicConfig,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts'
  ],
  coverageDirectory: '<rootDir>/coverage'
};

export default config;
