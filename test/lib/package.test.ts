import path from 'path';
import fs from 'fs-extra';

import {
  getPackageJsonPath,
  getPackageJsonVersion,
  updatePackageJsonVersion
} from '../../src/lib/package';

import {
  createTestOutDir,
  createDir,
  createRestoreInitialWorkingDir,
  createPackageJsonFile
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

  const packageJsonContents = { name: 'test-package', description: 'Test package', version };

  const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
  afterEach(() => restoreInitialWorkingDir());

  describe('getPackageJsonPath', () => {
    it('get package.json path in root directory', async() => {
      const outDirPath = await createTestOutDir('find-in-working', true);
      const packageJsonPath = await createPackageJsonFile(outDirPath, packageJsonContents);
      expect(await getPackageJsonPath()).toBe(packageJsonPath);
    });

    it('don\'t get package.json path when it doesn\'t exist', async() => {
      await createTestOutDir('no-package-json', true);
      expect(await getPackageJsonPath()).toBe(null);
    });

    it('don\'t get package.json path when it\'s when looking for it in nested directory', async() => {
      const outDirPath = await createTestOutDir('find-from-nested', true);
      const nestedDirPath = await createDir(path.resolve(outDirPath, 'nested'));
      await createPackageJsonFile(outDirPath, packageJsonContents);
      expect(await getPackageJsonPath(nestedDirPath)).toBe(null);
    });
  });

  describe('getPackageJsonVersion', () => {
    it('get version from package.json', async() => {
      const outDirPath = await createTestOutDir('get-package-version', true);
      const packageJsonPath = await createPackageJsonFile(outDirPath, packageJsonContents);
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
        const packageJsonPath = await createPackageJsonFile(outDirPath, packageJsonContents);
        const updateResult = await updatePackageJsonVersion(packageJsonPath, release);
        checkUpdateResult(updateResult, release);
        const expectedPackageJson = { ...packageJsonContents, version: expectedVersion };
        expect(await fs.readJSON(packageJsonPath)).toEqual(expectedPackageJson);
      });

      it(`${label} version update without writing to file`, async() => {
        const outDirPath = await createTestOutDir(`${release}-update-without-saving`, true);
        const packageJsonPath = await createPackageJsonFile(outDirPath, packageJsonContents);
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
      const packageJsonPath = await createPackageJsonFile(outDirPath, { ...packageJsonContents, version: 'invalid' });
      const errorMessage = 'Version property is not specified or invalid';
      await expect(updatePackageJsonVersion(packageJsonPath, 'major')).rejects.toBe(errorMessage);
    });

    it('update by invalid release', async() => {
      const outDirPath = await createTestOutDir('invalid-release', true);
      const packageJsonPath = await createPackageJsonFile(outDirPath, packageJsonContents);
      const errorMessage = 'Unable to increase release version';
      await expect(updatePackageJsonVersion(packageJsonPath, 'invalid')).rejects.toBe(errorMessage);
    });
  });
});
