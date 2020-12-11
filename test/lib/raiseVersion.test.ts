import path from 'path';
import { mocked } from 'ts-jest/utils';

import raiseVersion from '../../src/lib/raiseVersion';

import { getRaiseVerRcConfig } from '../../src/lib/config';
import { getPackageJsonPath, getPackageJsonVersion, updatePackageJsonVersion } from '../../src/lib/package';
import { updateChangeLogVersion } from '../../src/lib/changeLog';
import { updateGitRepositoryVersion } from '../../src/lib/git';

import { getTestOurDirPath, loadFixtureFile } from '../helpers';

jest.mock('../../src/lib/config');
jest.mock('../../src/lib/package');
jest.mock('../../src/lib/changeLog');
jest.mock('../../src/lib/git');

describe('raiseVersion', () => {
  let defaultConfig: RaiseVersionConfig;
  beforeAll(async() => {
    defaultConfig = await loadFixtureFile('.raiseverrc-default.json');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('package.json is not found', async() => {
    mocked(getPackageJsonPath).mockImplementationOnce(() => Promise.resolve(null));
    await expect(raiseVersion()).rejects.toBe('Unable to locate package.json file');
  });

  it('release is not specified', async() => {
    const outDirPath = await getTestOurDirPath('no-release');
    mockPackageJson(outDirPath);
    mockConfig(defaultConfig);
    await expect(raiseVersion()).rejects.toBe('Release is not specified');
  });

  it('release is invalid', async() => {
    const outDirPath = await getTestOurDirPath('invalid-release');
    mockPackageJson(outDirPath);
    mockConfig(defaultConfig);
    await expect(raiseVersion({ release: 'invalid' })).rejects.toBe('Release is invalid');
  });

  const raiseDefault = async(dirName: string, options: {
    version: string;
    legacyVersion: string;
    skipUpdate?: boolean;
    release?: string;
    changeLog?: boolean;
    changeLogError?: boolean;
    git?: boolean;
    push?: boolean;
  }) => {
    let consoleErrorMock;
    try {
      const { version, legacyVersion, skipUpdate, release, changeLog, changeLogError, git, push } = options;
      const outDirPath = await getTestOurDirPath(dirName);
      const packageJsonPath = mockPackageJson(outDirPath);
      const config = mockConfig(defaultConfig, { changeLog, git, push });
      if (skipUpdate) {
        mocked(getPackageJsonVersion).mockImplementationOnce(() => Promise.resolve(legacyVersion));
      }
      if (changeLogError) {
        mocked(updateChangeLogVersion).mockImplementationOnce(() => Promise.reject('Changelog update error'));
        consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
      }
      const { changelog: changeLogConfig, git: gitConfig } = config;
      mockUpdatePageJsonVersion(version, legacyVersion);

      let updatedVersion;
      if (changeLogError) {
        await expect(raiseVersion({ skipUpdate, release })).rejects.toBe('Changelog update error');
        if (consoleErrorMock) {
          expect(consoleErrorMock).toHaveBeenCalledTimes(1);
          expect(consoleErrorMock).toHaveBeenCalledWith('Unable to update changelog, reverting changes back...');
        }
      }
      else {
        updatedVersion = await raiseVersion({ skipUpdate, release });
      }

      const expectedVersion = skipUpdate ? legacyVersion : version;
      if (skipUpdate) {
        expect(updatePackageJsonVersion).toHaveBeenCalledTimes(0);
      }
      else {
        expect(updatePackageJsonVersion).toHaveBeenCalledTimes(changeLogError ? 2 : 1);
        expect(updatePackageJsonVersion).toHaveBeenCalledWith(packageJsonPath, release);
        if (changeLogError) {
          expect(mocked(updatePackageJsonVersion).mock.calls[1]).toEqual([packageJsonPath, legacyVersion]);
        }
      }

      if (changeLogError) {
        return;
      }

      if (changeLogConfig.enabled) {
        expect(updateChangeLogVersion).toHaveBeenCalledTimes(1);
        expect(updateChangeLogVersion).toHaveBeenCalledWith(changeLogConfig.path, expectedVersion, {
          encoding: changeLogConfig.encoding,
          prefix: changeLogConfig.prefix,
          bullet: changeLogConfig.bullet
        });
      }
      else {
        expect(updateChangeLogVersion).toHaveBeenCalledTimes(0);
      }
      if (gitConfig.enabled) {
        expect(updateGitRepositoryVersion).toHaveBeenCalledTimes(1);
        expect(updateGitRepositoryVersion).toHaveBeenCalledWith(expectedVersion, {
          packageJsonPath,
          changeLogPath: changeLogConfig.path,
          release: gitConfig.release,
          development: gitConfig.development,
          remote: gitConfig.remote,
          commit: gitConfig.commit,
          merge: gitConfig.merge,
          all: gitConfig.all,
          tag: gitConfig.tag,
          push: gitConfig.push
        });
      }
      else {
        expect(updateGitRepositoryVersion).toHaveBeenCalledTimes(0);
      }

      expect(updatedVersion).toBe(expectedVersion);
    }
    finally {
      if (consoleErrorMock) {
        consoleErrorMock.mockRestore();
      }
    }
  };

  const version = '1.0.0';
  const legacyVersion = '0.1.0';
  const release = 'major';

  it('raise version with default configuration', async() => {
    await raiseDefault('raise', { version, legacyVersion, release });
  });

  it('raise version with default configuration and git push', async() => {
    await raiseDefault('raise-push', { version, legacyVersion, release, push: true });
  });

  it('don\'t update changelog', async() => {
    await raiseDefault('raise-no-changelog', { version, legacyVersion, release, changeLog: false });
  });

  it('don\'t update git', async() => {
    await raiseDefault('raise-no-git', { version, legacyVersion, release, git: false });
  });

  it('skip update', async() => {
    await raiseDefault('raise-skip-update', { version, legacyVersion, skipUpdate: true });
  });

  it('revert package.json changes when changelog update is failed', async() => {
    await raiseDefault('raise-changelog-failure', { version, legacyVersion, release, changeLogError: true });
  });

  it('don\'t revert package.json changes when changelog update is failed and version update is skipped', async() => {
    await raiseDefault('raise-changelog-fail-skip-update', {
      version, legacyVersion, changeLogError: true, skipUpdate: true
    });
  });
});

function mockPackageJson(outDirPath: string): string {
  const packageJsonPath = path.resolve(outDirPath, 'package.json');
  mocked(getPackageJsonPath).mockImplementationOnce(() => Promise.resolve(packageJsonPath));
  return packageJsonPath;
}

function mockConfig(config: RaiseVersionConfig, options: {
  changeLog?: boolean;
  git?: boolean;
  push?: boolean;
} = {}): RaiseVersionConfig {
  const { changeLog, git, push } = options;
  const resultConfig: RaiseVersionConfig = {
    ...config,
    changelog: {
      ...config.changelog,
      ...(typeof changeLog === 'boolean' ? { enabled: changeLog } : {})
    },
    git: {
      ...config.git,
      ...(typeof git === 'boolean' ? { enabled: git } : {}),
      ...(typeof push === 'boolean' ? { push } : {})
    }
  };
  mocked(getRaiseVerRcConfig).mockImplementationOnce(() => Promise.resolve(resultConfig));
  return resultConfig;
}

function mockUpdatePageJsonVersion(version: string, legacyVersion: string): void {
  mocked(updatePackageJsonVersion).mockImplementationOnce(() => Promise.resolve({ version, legacyVersion }));
}
