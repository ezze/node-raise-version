import path from 'path';
import fs from 'fs-extra';

import {
  findPackageJson,
  getPackageJsonVersion,
  updatePackageJsonVersion
} from '../../src/lib/package';

import {
  createTestOutDir,
  createDir,
  createRestoreInitialWorkingDir
} from '../helpers';

describe('package', () => {
  const version = '0.2.0';
  const updatedVersions: Record<string, string> = {
    major: '1.0.0',
    minor: '0.3.0',
    patch: '0.2.1',
    '0.1.0': '0.1.0',
    '1.2.3': '1.2.3',
    [version]: version
  };

  const packageJsonContents = { name: 'test-package', version };

  const createPackageJson = async(dirPath: string, contents: any): Promise<string> => {
    const packageJsonPath = path.resolve(dirPath, 'package.json');
    await fs.writeJSON(packageJsonPath, contents, { encoding: 'utf-8', spaces: 2 });
    return packageJsonPath;
  };

  const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
  afterEach(() => restoreInitialWorkingDir());

  describe('findPackageJson', () => {
    it('find package.json in root directory', async() => {
      const outDirPath = await createTestOutDir('find-in-working', true);
      const packageJsonPath = await createPackageJson(outDirPath, packageJsonContents);
      expect(await findPackageJson()).toBe(packageJsonPath);
    });

    it('find package.json starting from nested directory', async() => {
      const outDirPath = await createTestOutDir('find-from-nested', true);
      const nestedDirPath = await createDir(path.resolve(outDirPath, 'nested'));
      const packageJsonPath = await createPackageJson(outDirPath, packageJsonContents);
      expect(await findPackageJson(outDirPath, nestedDirPath)).toBe(packageJsonPath);
    });

    it('don\'t find package.json if it doesn\'t exist', async() => {
      await createTestOutDir('no-package-json', true);
      expect(await findPackageJson()).toBe(null);
    });

    it('look for package.json outside of root directory', async() => {
      const outDirPath = await createTestOutDir('working-outside-of-root', true);
      const rootDirPath = await createDir(path.resolve(outDirPath, 'root'));
      await createPackageJson(outDirPath, packageJsonContents);
      const errorMessage = 'Working directory is outside of root directory';
      await expect(findPackageJson(rootDirPath, outDirPath)).rejects.toBe(errorMessage);
    });
  });

  describe('getPackageJsonVersion', () => {
    it('get version from package.json', async() => {
      const outDirPath = await createTestOutDir('get-package-version', true);
      const packageJsonPath = await createPackageJson(outDirPath, packageJsonContents);
      expect(await getPackageJsonVersion(packageJsonPath)).toBe(version);
    });

    it('get version from non-existing package.json', async() => {
      const outDirPath = await createTestOutDir('no-package-json', true);
      const packageJsonPath = path.resolve(outDirPath, 'package.json');
      const errorMessage = 'Unable to read version from package.json';
      await expect(getPackageJsonVersion(packageJsonPath)).rejects.toBe(errorMessage);
    });
  });

  describe('updatePackageJsonVersion', () => {
    const checkUpdateResult = (updateResult: {
      version: string;
      legacyVersion: string;
    }, release: string) => {
      expect(updateResult.version).toBe(updatedVersions[release]);
      expect(updateResult.legacyVersion).toBe(version);
    };

    Object.entries(updatedVersions).forEach(([release, expectedVersion]) => {
      let label = release;
      if (release === expectedVersion) {
        if (version === expectedVersion) {
          label = `the same ${expectedVersion}`;
        }
        else {
          label = `exact ${expectedVersion}`;
        }
      }

      it(`${label} version update`, async() => {
        const outDirPath = await createTestOutDir(`${release}-update`, true);
        const packageJsonPath = await createPackageJson(outDirPath, packageJsonContents);
        const updateResult = await updatePackageJsonVersion(packageJsonPath, release);
        checkUpdateResult(updateResult, release);
        const expectedPackageJson = { ...packageJsonContents, version: expectedVersion };
        expect(await fs.readJSON(packageJsonPath)).toEqual(expectedPackageJson);
      });

      it(`${label} version update without writing to file`, async() => {
        const outDirPath = await createTestOutDir(`${release}-update-without-saving`, true);
        const packageJsonPath = await createPackageJson(outDirPath, packageJsonContents);
        const updateResult = await updatePackageJsonVersion(packageJsonPath, release, { write: false });
        await checkUpdateResult(updateResult, release);
        expect(await fs.readJSON(packageJsonPath)).toEqual(packageJsonContents);
      });
    });

    it('update non-existing package.json', async() => {
      const outDirPath = await createTestOutDir('no-package-json', true);
      const packageJsonPath = path.resolve(outDirPath, 'package.json');
      const errorMessage = 'Unable to read package.json';
      await expect(updatePackageJsonVersion(packageJsonPath, 'major')).rejects.toBe(errorMessage);
    });

    it('update invalid version in package.json', async() => {
      const outDirPath = await createTestOutDir('invalid-version', true);
      const packageJsonPath = await createPackageJson(outDirPath, { ...packageJsonContents, version: 'invalid' });
      const errorMessage = 'Version property is not specified or invalid';
      await expect(updatePackageJsonVersion(packageJsonPath, 'major')).rejects.toBe(errorMessage);
    });

    it('update by invalid release', async() => {
      const outDirPath = await createTestOutDir('invalid-release', true);
      const packageJsonPath = await createPackageJson(outDirPath, packageJsonContents);
      const errorMessage = 'Unable to increase release version';
      await expect(updatePackageJsonVersion(packageJsonPath, 'invalid')).rejects.toBe(errorMessage);
    });
  });
});
