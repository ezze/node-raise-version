import moment from 'moment';

import { updateGitRepositoryVersion } from '../../src/lib/git';

import {
  createTestOutDir,
  createRestoreInitialWorkingDir,
  createPackageJsonFile,
  createChangeLogFile,
  createRepository,
  createBranch,
  addRemoteRepository,
  commitAll,
  getCommitRef,
  getCommitId,
  getCommitMessage,
  getCommitDiff,
  extractFileDiff,
  loadFixtureFile,
  applyTokens, checkoutBranch
} from '../helpers';

describe('git', () => {
  describe('updateGitRepositoryVersion', () => {
    let gitFixture: Record<string, any>;

    const extractGitFixtureData = (options: {
      release?: string;
    } = {}): {
      version: string;
      packageJsonContents: Record<string, any>;
      packageJsonDiff: Array<string>;
      changeLogContentsInitial?: Array<string>;
      changeLogContentsAltered?: Array<string>;
      changeLogDiff?: Array<string>;
    } => {
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
    };

    beforeAll(async() => {
      gitFixture = await loadFixtureFile('git.json');
    });

    const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
    afterEach(() => restoreInitialWorkingDir());

    const releaseBranch = 'master';
    const developBranch = 'develop';

    it('don\'t commit from non-development branch', async() => {
      const { version, packageJsonContents } = extractGitFixtureData();
      const outDirPath = await createTestOutDir('no-commit-from-non-develop', true);
      const { repoPath, packageJsonPath } = await createRepositories(outDirPath, {
        packageJsonContents,
        developBranch
      });
      await checkoutBranch(repoPath, releaseBranch);
      await expect(updateGitRepositoryVersion(version, { repoPath, packageJsonPath, all: false })).rejects.toBe(
        `Git repository can be updated only from development "${developBranch}" branch, ` +
        `currently on "${releaseBranch}".`
      );
    });

    ['major', 'minor', 'patch'].forEach(release => {
      it(`${release} update and commit without changelog`, async() => {
        const { version, packageJsonContents, packageJsonDiff } = extractGitFixtureData({ release });
        const outDirPath = await createTestOutDir(`gitflow-${release}-update-no-changelog`, true);
        const { repoPath, packageJsonPath } = await createRepositories(outDirPath, {
          packageJsonContents,
          developBranch
        });
        await createPackageJsonFile(repoPath, { ...packageJsonContents, version });
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, all: false });
        await checkCommits(repoPath, { version, releaseBranch, developBranch });
        const diff = await getLastCommitDiff(repoPath, developBranch);
        expect(extractFileDiff(diff, 'package.json')).toEqual(packageJsonDiff);
        expect(extractFileDiff(diff, 'CHANGELOG.md')).toEqual([]);
      });

      it(`${release} update and commit with changelog`, async() => {
        const {
          version, packageJsonContents, packageJsonDiff,
          changeLogContentsInitial, changeLogContentsAltered, changeLogDiff
        } = extractGitFixtureData({ release });
        if (!changeLogContentsInitial || !changeLogContentsAltered || !changeLogDiff) {
          return Promise.reject('Changelog fixture data is not available');
        }
        const outDirPath = await createTestOutDir(`gitflow-${release}-update`, true);
        const { repoPath, packageJsonPath, changeLogPath } = await createRepositories(outDirPath, {
          packageJsonContents,
          changeLogContents: changeLogContentsInitial,
          developBranch
        });
        if (!changeLogPath) {
          return Promise.reject('Changelog file is not available');
        }
        await createPackageJsonFile(repoPath, { ...packageJsonContents, version });
        await createChangeLogFile(repoPath, changeLogContentsAltered);
        await updateGitRepositoryVersion(version, { repoPath, packageJsonPath, changeLogPath, all: false });
        await checkCommits(repoPath, { version, releaseBranch, developBranch });
        const diff = await getLastCommitDiff(repoPath, developBranch);
        expect(extractFileDiff(diff, 'package.json')).toEqual(packageJsonDiff);
        expect(extractFileDiff(diff, 'CHANGELOG.md')).toEqual(changeLogDiff);
      });
    });
  });
});

async function createRepositories(outDirPath: string, options: {
  bare?: boolean;
  packageJsonContents: Record<string, any>;
  changeLogContents?: Array<string>;
  developBranch?: string;
}): Promise<{
  repoPath: string;
  bareRepoPath?: string;
  packageJsonPath: string;
  changeLogPath?: string;
}> {
  const { bare, packageJsonContents, changeLogContents, developBranch } = options;

  const repoPath = await createRepository(outDirPath, { initialCommit: true });
  let bareRepoPath;
  if (bare) {
    bareRepoPath = await createRepository(outDirPath, { bare: true });
    await addRemoteRepository(repoPath, bareRepoPath);
  }

  if (developBranch) {
    await createBranch(repoPath, developBranch);
  }

  const packageJsonPath = await createPackageJsonFile(repoPath, packageJsonContents);
  await commitAll(repoPath, 'Add package.json file.');

  let changeLogPath;
  if (changeLogContents) {
    changeLogPath = await createChangeLogFile(repoPath, changeLogContents);
    await commitAll(repoPath, 'Add changelog file.');
  }

  process.chdir(repoPath);
  return { repoPath, bareRepoPath, packageJsonPath, changeLogPath };
}

async function getLastCommitDiff(repoPath: string, branch: string) {
  return getCommitDiff(repoPath, getCommitRef(branch, ['~1']), getCommitRef(branch));
}

async function checkCommits(repoPath: string, options: {
  version: string;
  releaseBranch: string;
  developBranch: string;
  tag?: boolean;
}) {
  const { version, releaseBranch, developBranch, tag = true } = options;
  await checkDevelopCommitMessage(repoPath, developBranch, version);
  await checkReleaseCommitMessage(repoPath, releaseBranch, version);
  const releaseCommitId = await getCommitId(repoPath, releaseBranch);
  const releaseParent2CommitId = await getCommitId(repoPath, getCommitRef(releaseBranch, ['^2']));
  const developCommitId = await getCommitId(repoPath, developBranch);
  expect(releaseParent2CommitId).toEqual(developCommitId);
  if (tag) {
    const tagCommitId = await getCommitId(repoPath, version);
    expect(tagCommitId).toEqual(releaseCommitId);
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
