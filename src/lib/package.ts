import path from 'path';
import fs from 'fs-extra';
import semver, { ReleaseType } from 'semver';

import { releases } from './constants';
import { fileExists } from './utils';

async function findPackageJson(workingDirectoryPath = process.cwd()): Promise<string | null> {
  const packageJsonPath = path.resolve(workingDirectoryPath, 'package.json');
  if (await fileExists(packageJsonPath)) {
    return packageJsonPath;
  }
  const pathParts = workingDirectoryPath.split(path.sep);
  if (pathParts.length === 1) {
    return null;
  }
  pathParts.pop();
  return findPackageJson(pathParts.join(path.sep));
}

async function getPackageJsonVersion(packageJsonPath: string): Promise<string> {
  const packageJson = await fs.readJson(packageJsonPath);
  return packageJson.version;
}

async function updatePackageJsonVersion(packageJsonPath: string, release: string, options: {
  write?: boolean;
} = {}): Promise<{
  version: string;
  legacyVersion: string;
}> {
  const { write = true } = options;

  console.log(`Updating "${packageJsonPath}"...`);

  const packageJson = await fs.readJson(packageJsonPath);
  const { version: legacyVersion } = packageJson;
  if (!semver.valid(legacyVersion)) {
    return Promise.reject('Version property is not specified or invalid');
  }

  let version: string | null;
  if (semver.valid(release)) {
    version = release as string;
  }
  else {
    version = semver.inc(legacyVersion, release as ReleaseType);
  }
  if (!version) {
    return Promise.reject('Unable to increase release version');
  }

  const updateLabel = `${legacyVersion} => ${version}`;
  let prefixLabel = releases.includes(release) ? release : '';
  if (!prefixLabel) {
    if (semver.lt(version, legacyVersion)) {
      prefixLabel = 'revert';
    }
    else if (semver.gt(version, legacyVersion)) {
      prefixLabel = 'raise';
    }
    else {
      prefixLabel = 'updating';
    }
  }
  console.log(`${prefixLabel}: ${updateLabel}`);
  packageJson.version = version;
  if (write) {
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
  console.log(`Version in "${packageJsonPath}" is updated.`);
  return { version, legacyVersion };
}

export {
  findPackageJson,
  getPackageJsonVersion,
  updatePackageJsonVersion
};
