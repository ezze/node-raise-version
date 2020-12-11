import path from 'path';
import { mocked } from 'ts-jest/utils';

import initVersion from '../../src/lib/initVersion';
import { getRaiseVerRcPath, readRaiseVerRc, writeRaiseVerRc } from '../../src/lib/config';
import { fileExists } from '../../src/lib/utils';

import { createTestOutDir, loadFixtureFile } from '../helpers';

jest.mock('../../src/lib/config');
jest.mock('../../src/lib/utils');

const raiseVerRcName = '.raiseverrc';

describe('initVersion', () => {
  let defaultConfig: RaiseVersionConfig;

  beforeAll(async() => {
    defaultConfig = await loadFixtureFile('.raiseverrc-default.json');
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('create default .raiseverrc', async() => {
    const outDirPath = await createTestOutDir('raiseverrc-create', true);
    const raiseVerRcPath = path.resolve(outDirPath, raiseVerRcName);
    mocked(getRaiseVerRcPath).mockImplementationOnce(() => Promise.resolve(raiseVerRcPath));
    mocked(fileExists).mockImplementationOnce(() => Promise.resolve(false));
    const config = await initVersion();
    expect(writeRaiseVerRc).toHaveBeenCalledTimes(1);
    expect(writeRaiseVerRc).toHaveBeenCalledWith(raiseVerRcPath, defaultConfig);
    expect(config).toEqual(defaultConfig);
  });

  it('.raiseverrc already exists', async() => {
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
    try {
      const outDirPath = await createTestOutDir('raiseverrc-exists', true);
      const raiseVerRcPath = path.resolve(outDirPath, raiseVerRcName);
      const existingConfig = {
        changelog: defaultConfig.changelog,
        git: { ...defaultConfig.git, push: true }
      };
      mocked(getRaiseVerRcPath).mockImplementationOnce(() => Promise.resolve(raiseVerRcPath));
      mocked(fileExists).mockImplementationOnce(() => Promise.resolve(true));
      mocked(readRaiseVerRc).mockImplementationOnce(() => Promise.resolve(existingConfig));
      const config = await initVersion();
      expect(consoleWarnMock).toHaveBeenCalledTimes(1);
      expect(consoleWarnMock).toHaveBeenCalledWith(`File "${raiseVerRcPath}" already exists`);
      expect(readRaiseVerRc).toHaveBeenCalledTimes(1);
      expect(readRaiseVerRc).toHaveBeenCalledWith(path.resolve(outDirPath, raiseVerRcName));
      expect(config).toEqual(existingConfig);
    }
    finally {
      consoleWarnMock.mockRestore();
    }
  });
});

async function mockConfig(outDirPath: string, config?: RaiseVersionConfig) {
  jest.doMock('../../src/lib/config', () => {
    return {
      getRaiseVerRcPath: jest.fn().mockImplementation(() => path.resolve(outDirPath, '.raiseverrc')),
      readRaiseVerRc: jest.fn().mockImplementation(() => config),
      writeRaiseVerRc: jest.fn()
    };
  });
  const { readRaiseVerRc, writeRaiseVerRc } = await import('../../src/lib/config');
  return { readRaiseVerRc, writeRaiseVerRc };
}
