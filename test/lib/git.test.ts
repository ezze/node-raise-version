import path from 'path';
import moment from 'moment';
import semver, { ReleaseType } from 'semver';

import { updateGitRepositoryVersion } from '../../src/lib/git';

import {
  createTestOutDir,
  createTextFile,
  createRestoreInitialWorkingDir,
  createPackageJsonFile,
  createChangeLogFile,
  createRepository,
  createBranch,
  checkoutBranch,
  addRemoteRepository,
  commitAll,
  getCommitRef,
  getCommitId,
  getCommitMessage,
  getCommitDiff,
  extractFileDiff,
  getModifiedFiles,
  loadFixtureFile,
  applyTokens
} from '../helpers';

describe('git', () => {
  describe('updateGitRepositoryVersion', () => {
    const releaseBranch = 'master';
    const remoteName = 'origin';
    const initializationError = () => Promise.reject('Some data is not initialized');

    beforeEach(() => {
      jest.resetModules();
    });

    const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
    afterEach(() => restoreInitialWorkingDir());

    ['major', 'minor', 'patch'].forEach(release => {
      it(`gitflow ${release}: don't commit from non-development branch`, async() => {
        const { version, repoPath, developBranch, packageJsonPath } = await initialize(
          `gitflow-${release}-no-commit-from-non-develop`,
          release,
          { packageJson: true }
        );
        if (!packageJsonPath) {
          return initializationError();
        }
        await checkoutBranch(repoPath, releaseBranch);
        const errorMessage = `Git repository can be updated only from development "${developBranch}" branch, ` +
          `currently on "${releaseBranch}".`;
        await expect(updateGitRepositoryVersion(version, { repoPath, packageJsonPath })).rejects.toBe(errorMessage);
      });

      it(`gitflow ${release}: nothing to commit`, async() => {
        const { version, repoPath, packageJsonPath } = await initialize(
          `gitflow-${release}-nothing-to-commit`,
          release, { packageJson: true }
        );
        if (!packageJsonPath) {
          return initializationError();
        }
        const errorMessage = 'There is nothing to commit';
        await expect(updateGitRepositoryVersion(version, { repoPath, packageJsonPath })).rejects.toBe(errorMessage);
      });

      it(`gitflow ${release}: commit`, async() => {
        const {
          version, repoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-commit`, release, { packageJson: true });
        if (!packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath });
        await checkRepoUpdate(repoPath, { version, releaseBranch, developBranch, packageJsonDiff });
      });

      it(`gitflow ${release}: commit all`, async() => {
        const {
          version, repoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-commit-all`, release, { packageJson: true });
        if (!packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        const fileName = 'file.txt';
        const fileContents = 'hello world';
        await createTextFile(path.resolve(repoPath, fileName), fileContents);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, all: true });
        const { diff } = await checkRepoUpdate(repoPath, { version, releaseBranch, developBranch, packageJsonDiff });
        expect(extractFileDiff(diff, fileName)).toEqual([`+${fileContents}`]);
      });

      it(`gitflow ${release}: commit explicitly and stash other stuff`, async() => {
        const {
          version, repoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-commit-explicitly-stash`, release, { packageJson: true });
        if (!packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        const fileName = 'file.txt';
        const fileContents1 = 'hello world';
        const fileContents2 = 'goodbye';
        await createTextFile(path.resolve(repoPath, fileName), fileContents1);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, all: true });
        const nextVersion = semver.inc(version, release as ReleaseType);
        await createPackageJsonFile(repoPath, { ...packageJsonContentsAltered, version: nextVersion });
        await createTextFile(path.resolve(repoPath, fileName), fileContents2);
        await updateGitRepositoryVersion(nextVersion as string, { repoPath, packageJsonPath });
        const diff = await getLastCommitDiff(repoPath, developBranch);
        expect(await getModifiedFiles(repoPath)).toEqual([fileName]);
        expect(extractFileDiff(diff, fileName)).toEqual([]);
      });

      it(`gitflow ${release}: commit and push to remote repository`, async() => {
        const {
          version, repoPath, remoteRepoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-commit-push`, release, { remoteName, packageJson: true });
        if (!packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, push: true });
        await checkRepoUpdate(repoPath, { remoteRepoPath, version, releaseBranch, developBranch, packageJsonDiff });
      });

      it(`gitflow ${release}: don't commit, just push to remote repository`, async() => {
        const {
          repoPath, remoteRepoPath, developBranch,
          packageJsonPath, packageJsonContents, packageJsonDiff
        } = await initialize(`gitflow-${release}-no-commit-push`, release, { remoteName, packageJson: true });
        if (!packageJsonPath || !packageJsonContents || !packageJsonDiff) {
          return initializationError();
        }
        const { version } = packageJsonContents;
        await updateGitRepositoryVersion(version, { repoPath, commit: false, push: true });
        await checkRepoUpdate(repoPath, {
          remoteRepoPath, version, releaseBranch, developBranch, packageJsonDiff, commit: false
        });
      });

      it(`gitflow ${release}: commit with changelog`, async() => {
        const {
          version, repoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff,
          changeLogPath, changeLogContentsAltered, changeLogDiff
        } = await initialize(
          `gitflow-${release}-commit-changelog`,
          release, { packageJson: true, changeLog: true }
        );
        if (
          !packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff ||
          !changeLogPath || !changeLogContentsAltered || !changeLogDiff
        ) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        await createChangeLogFile(repoPath, changeLogContentsAltered);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, changeLogPath });
        await checkRepoUpdate(repoPath, { version, releaseBranch, developBranch, packageJsonDiff, changeLogDiff });
      });

      it(`gitflow ${release}: commit, push and revert back on push failure`, async() => {
        // TODO: mock git push somehow
        const {
          version, repoPath, remoteRepoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-commit-push-revert`, release, { remoteName, packageJson: true });
        if (!packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, push: true });
      });
    });
  });
});

async function initialize(dirName: string, release: string, options?: {
  remoteName?: string;
  developBranch?: string;
  packageJson?: boolean;
  changeLog?: boolean;
}): Promise<{
  version: string;
  repoPath: string;
  remoteRepoPath?: string;
  developBranch: string;
  packageJsonPath?: string;
  packageJsonContents?: { [key: string]: any };
  packageJsonContentsAltered?: { [key: string]: any };
  packageJsonDiff?: Array<string>;
  changeLogPath?: string;
  changeLogContents?: Array<string>;
  changeLogContentsAltered?: Array<string>;
  changeLogDiff?: Array<string>;
}> {
  const {
    remoteName,
    developBranch = 'develop',
    packageJson = false,
    changeLog = false
  } = options || {};

  const {
    version,
    packageJsonContents,
    packageJsonDiff,
    changeLogContentsInitial: changeLogContents,
    changeLogContentsAltered,
    changeLogDiff
  } = await extractGitFixtureData({ release });

  const outDirPath = await createTestOutDir(dirName, true);
  const createOptions = { remoteName, developBranch };
  if (packageJson) {
    Object.assign(createOptions, { packageJsonContents });
  }
  if (changeLog) {
    Object.assign(createOptions, { changeLogContents });
  }

  const {
    repoPath,
    remoteRepoPath,
    packageJsonPath,
    changeLogPath
  } = await createRepositories(outDirPath, createOptions);

  const data = { version, developBranch, repoPath };
  if (remoteName) {
    Object.assign(data, { remoteRepoPath });
  }
  if (packageJson) {
    const packageJsonContentsAltered = { ...packageJsonContents, version };
    Object.assign(data, { packageJsonPath, packageJsonContents, packageJsonContentsAltered, packageJsonDiff });
  }
  if (changeLog) {
    Object.assign(data, { changeLogPath, changeLogContents, changeLogContentsAltered, changeLogDiff });
  }
  return data;
}

let gitFixture: Record<string, any>;
async function extractGitFixtureData(options: {
  release: string;
}): Promise<{
  version: string;
  packageJsonContents: Record<string, any>;
  packageJsonDiff: Array<string>;
  changeLogContentsInitial: Array<string>;
  changeLogContentsAltered: Array<string>;
  changeLogDiff: Array<string>;
}> {
  if (!gitFixture) {
    gitFixture = await loadFixtureFile('git.json');
  }

  const { release } = options;
  const { versions, packageJson, changeLog } = gitFixture;
  const version = release ? versions[release] : null;
  const date = moment().format('YYYY-MM-DD');
  const tokens = { date };
  if (version) {
    Object.assign(tokens, { version });
  }

  return {
    version,
    packageJsonContents: packageJson.contents,
    packageJsonDiff: applyTokens(packageJson.diff, tokens),
    changeLogContentsInitial: changeLog.contents.initial,
    changeLogContentsAltered: applyTokens(changeLog.contents.altered, tokens),
    changeLogDiff: applyTokens(changeLog.diff, tokens)
  };
}

async function createRepositories(outDirPath: string, options: {
  remoteName?: string;
  packageJsonContents?: Record<string, any>;
  changeLogContents?: Array<string>;
  developBranch?: string;
}): Promise<{
  repoPath: string;
  remoteRepoPath?: string;
  packageJsonPath?: string;
  changeLogPath?: string;
}> {
  const { remoteName, packageJsonContents, changeLogContents, developBranch } = options;

  const repoPath = await createRepository(outDirPath, { initialCommit: true });
  let remoteRepoPath;
  if (remoteName) {
    remoteRepoPath = await createRepository(outDirPath, { bare: true });
    await addRemoteRepository(repoPath, remoteRepoPath, remoteName);
  }

  if (developBranch) {
    await createBranch(repoPath, developBranch);
  }

  let packageJsonPath;
  if (packageJsonContents) {
    packageJsonPath = await createPackageJsonFile(repoPath, packageJsonContents);
    await commitAll(repoPath, 'Add package.json file.');
  }

  let changeLogPath;
  if (changeLogContents) {
    changeLogPath = await createChangeLogFile(repoPath, changeLogContents);
    await commitAll(repoPath, 'Add changelog file.');
  }

  process.chdir(repoPath);
  return { repoPath, remoteRepoPath, packageJsonPath, changeLogPath };
}

async function getLastCommitDiff(repoPath: string, branch: string) {
  return getCommitDiff(repoPath, getCommitRef(branch, ['~1']), getCommitRef(branch));
}

async function checkRepoUpdate(repoPath: string, options: {
  remoteRepoPath?: string;
  version: string;
  releaseBranch: string;
  developBranch: string;
  packageJsonDiff?: Array<string>;
  changeLogDiff?: Array<string>;
  commit?: boolean;
}): Promise<{
  diff: Array<string>;
}> {
  const {
    remoteRepoPath, version, releaseBranch, developBranch,
    packageJsonDiff = [], changeLogDiff = [], commit = true
  } = options;
  await checkCommits(repoPath, { remoteRepoPath, version, releaseBranch, developBranch, commit });
  const diff = await getLastCommitDiff(repoPath, developBranch);
  if (commit) {
    expect(extractFileDiff(diff, 'package.json')).toEqual(packageJsonDiff);
    expect(extractFileDiff(diff, 'CHANGELOG.md')).toEqual(changeLogDiff);
  }
  return { diff };
}

async function checkCommits(repoPath: string, options: {
  remoteRepoPath?: string;
  version: string;
  releaseBranch: string;
  developBranch: string;
  commit?: boolean;
  tag?: boolean;
}) {
  const { remoteRepoPath, version, releaseBranch, developBranch, commit = true, tag = true } = options;

  if (commit) {
    await checkDevelopCommitMessage(repoPath, developBranch, version);
    await checkReleaseCommitMessage(repoPath, releaseBranch, version);
  }

  const developCommitId = await getCommitId(repoPath, developBranch);
  const releaseCommitId = await getCommitId(repoPath, releaseBranch);
  const releaseParent2CommitId = await getCommitId(repoPath, getCommitRef(releaseBranch, ['^2']));

  expect(releaseParent2CommitId).toEqual(developCommitId);
  if (tag) {
    const tagCommitId = await getCommitId(repoPath, version);
    expect(tagCommitId).toEqual(releaseCommitId);
  }

  if (remoteRepoPath) {
    const remoteDevelopCommitId = await getCommitId(repoPath, `origin/${developBranch}`);
    const remoteReleaseCommitId = await getCommitId(repoPath, `origin/${releaseBranch}`);
    expect(remoteDevelopCommitId).toEqual(developCommitId);
    expect(remoteReleaseCommitId).toEqual(releaseCommitId);
  }
}

async function checkCommitMessage(repoPath: string, branch: string, message: string) {
  expect(await getCommitMessage(repoPath, branch)).toBe(message);
}

async function checkDevelopCommitMessage(repoPath: string, branch: string, version: string) {
  await checkCommitMessage(repoPath, getCommitRef(branch), `Raise version: ${version}.`);
}

async function checkReleaseCommitMessage(repoPath: string, branch: string, version: string) {
  await checkCommitMessage(repoPath, getCommitRef(branch), `Version ${version}.`);
}
