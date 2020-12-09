import path from 'path';
import moment from 'moment';

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
  loadFixtureFile,
  applyTokens
} from '../helpers';

describe('git', () => {
  describe('updateGitRepositoryVersion', () => {
    const releaseBranch = 'master';
    const remoteName = 'origin';
    const initializationError = () => Promise.reject('Some data is not initialized');

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

      it(`gitflow ${release}: update and commit`, async() => {
        const {
          version, repoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-update-commit`, release, { packageJson: true });
        if (!packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath });
        await checkRepoUpdate(repoPath, { version, releaseBranch, developBranch, packageJsonDiff });
      });

      it(`gitflow ${release}: update and commit all`, async() => {
        const {
          version, repoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-update-commit-all`, release, { packageJson: true });
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

      it(`gitflow ${release}: update, commit and push to remote repository`, async() => {
        const {
          version, repoPath, remoteRepoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff
        } = await initialize(`gitflow-${release}-update-commit-push`, release, { remoteName, packageJson: true });
        if (!packageJsonPath || !packageJsonContentsAltered || !packageJsonDiff) {
          return initializationError();
        }
        await createPackageJsonFile(repoPath, packageJsonContentsAltered);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, push: true });
        await checkRepoUpdate(repoPath, { remoteRepoPath, version, releaseBranch, developBranch, packageJsonDiff });
      });

      it(`gitflow ${release}: update and commit with changelog`, async() => {
        const {
          version, repoPath, developBranch,
          packageJsonPath, packageJsonContentsAltered, packageJsonDiff,
          changeLogPath, changeLogContentsAltered, changeLogDiff
        } = await initialize(
          `gitflow-${release}-update-commit-changelog`,
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
  packageJsonContentsAltered?: Array<string>;
  packageJsonDiff?: Array<string>;
  changeLogPath?: string;
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
    changeLogContentsInitial,
    changeLogContentsAltered,
    changeLogDiff
  } = await extractGitFixtureData({ release });

  const outDirPath = await createTestOutDir(dirName, true);
  const createOptions = { remoteName, developBranch };
  if (packageJson) {
    Object.assign(createOptions, { packageJsonContents });
  }
  if (changeLog) {
    Object.assign(createOptions, { changeLogContents: changeLogContentsInitial });
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
    Object.assign(data, { packageJsonPath, packageJsonContentsAltered, packageJsonDiff });
  }
  if (changeLog) {
    Object.assign(data, { changeLogPath, changeLogContentsAltered, changeLogDiff });
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
}): Promise<{
  diff: Array<string>;
}> {
  const { remoteRepoPath, version, releaseBranch, developBranch, packageJsonDiff = [], changeLogDiff = [] } = options;
  await checkCommits(repoPath, { remoteRepoPath, version, releaseBranch, developBranch });
  const diff = await getLastCommitDiff(repoPath, developBranch);
  expect(extractFileDiff(diff, 'package.json')).toEqual(packageJsonDiff);
  expect(extractFileDiff(diff, 'CHANGELOG.md')).toEqual(changeLogDiff);
  return { diff };
}

async function checkCommits(repoPath: string, options: {
  remoteRepoPath?: string;
  version: string;
  releaseBranch: string;
  developBranch: string;
  tag?: boolean;
}) {
  const { remoteRepoPath, version, releaseBranch, developBranch, tag = true } = options;
  await checkDevelopCommitMessage(repoPath, developBranch, version);
  await checkReleaseCommitMessage(repoPath, releaseBranch, version);

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
