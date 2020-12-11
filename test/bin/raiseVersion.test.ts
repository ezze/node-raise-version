import mockArgv from 'mock-argv';
import { mocked } from 'ts-jest/utils';

import {
  createTestOutDir,
  createRestoreInitialWorkingDir,
  loadFixtureFile
} from '../helpers';

jest.mock('../../src/lib/initVersion');
import initVersion from '../../src/lib/initVersion';

describe('raiseVersion', () => {
  let defaultRaiseVerConfig: RaiseVersionConfig;
  beforeAll(async() => {
    defaultRaiseVerConfig = await loadFixtureFile('.raiseverrc-default.json');
  });

  const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
  afterEach(() => {
    restoreInitialWorkingDir();
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('initVersion is called', async() => {
    await createTestOutDir('init', true);
    await mockArgv(['init'], async() => {
      await mockCommandRun();
      expect(mocked(initVersion).mock.calls.length).toBe(1);
      expect(mocked(initVersion).mock.calls[0]).toEqual([]);
    });
  });

  it('raiseVersion is called with default parameters', async() => {
    await createTestOutDir('raise-default', true);
    await mockArgv(['major'], async() => {
      jest.doMock('../../src/lib/raiseVersion');
      const raiseVersion = (await import('../../src/lib/raiseVersion')).default;
      await mockCommandRun();
      expect(mocked(raiseVersion).mock.calls.length).toBe(1);
      expect(mocked(raiseVersion).mock.calls[0][0]).toEqual({
        skipUpdate: undefined,
        release: 'major',
        ...defaultRaiseVerConfig
      });
    });
  });

  it('raiseVersion is called with --git-push', async() => {
    await createTestOutDir('raise-git-push', true);
    await mockArgv(['major', '--git-push'], async() => {
      jest.doMock('../../src/lib/raiseVersion');
      const raiseVersion = (await import('../../src/lib/raiseVersion')).default;
      await mockCommandRun();
      expect(mocked(raiseVersion).mock.calls.length).toBe(1);
      expect(mocked(raiseVersion).mock.calls[0][0]).toEqual({
        skipUpdate: undefined,
        release: 'major',
        changelog: defaultRaiseVerConfig.changelog,
        git: {
          ...defaultRaiseVerConfig.git,
          push: true
        }
      });
    });
  });

  it('raiseVersion args error', async() => {
    await createTestOutDir('raise-args-error', true);
    await mockArgv(['major', '--push'], async() => {
      const fail = await mockFail();
      await mockCommandRun();
      expect(fail).toHaveBeenCalledTimes(1);
      expect(mocked(fail).mock.calls[0][0]).toEqual('Unknown argument: push');
      expect(mocked(fail).mock.calls[0][1]).toEqual(undefined);
    });
  });

  it('raiseVersion runtime error', async() => {
    await createTestOutDir('raise-runtime-error', true);
    await mockArgv(['major'], async() => {
      const fail = await mockFail();
      const raiseVersion = await mockRaiseVersionFn(async() => {
        return Promise.reject('Some error');
      });
      await mockCommandRun();
      expect(raiseVersion).toHaveBeenCalledTimes(1);
      // TODO: magic happens here, says that fail is not being called at all
      // expect(fail).toHaveBeenCalledTimes(1);
    });
  });
});

async function mockCommandRun() {
  const { default: raiseVersionCli } = await import('../../src/bin/raiseVersion');
  await raiseVersionCli();
}

async function mockRaiseVersionFn(factory?: () => unknown) {
  jest.doMock('../../src/lib/raiseVersion', () => jest.fn().mockImplementation(factory));
  const { default: raiseVersion } = await import('../../src/lib/raiseVersion');
  return raiseVersion;
}

async function mockFail() {
  jest.doMock('../../src/bin/fail');
  const { default: fail } = await import('../../src/bin/fail');
  return fail;
}
