import { updateGitRepositoryVersion } from '../../src/lib/git';

import {
  createTestOutDir,
  createRestoreInitialWorkingDir,
  createPackageJson,
  createRepository,
  createBranch,
  addRemoteRepository,
  commitAll
} from '../helpers';

describe('git', () => {
  describe('updateGitRepositoryVersion', () => {
    const packageJsonContents = { name: 'test-package', description: 'Test package', version: '0.2.0' };

    const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
    afterEach(() => restoreInitialWorkingDir());

    const createGitRepos = async(outDirPath: string, options: {
      packageJsonContents: Record<string, any>;
    }): Promise<{
      repoPath: string;
      bareRepoPath: string;
    }> => {
      const { packageJsonContents } = options;
      const repoPath = await createRepository(outDirPath, { initialCommit: true });
      const bareRepoPath = await createRepository(outDirPath, { bare: true });
      await addRemoteRepository(repoPath, bareRepoPath);
      await createPackageJson(repoPath, packageJsonContents);
      await commitAll(repoPath, 'Add package.json.');
      return { repoPath, bareRepoPath };
    };

    it('update and commit without changelog', async() => {
      const outDirPath = await createTestOutDir('gitflow-version-no-changelog', true);
      const { repoPath, bareRepoPath } = await createGitRepos(outDirPath, { packageJsonContents });

    });
  });
});
