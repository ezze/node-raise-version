import path from 'path';
import fs from 'fs-extra';
import semver, { ReleaseType } from 'semver';

import { releases } from './constants';
import { fileExists } from './utils';

export async function findPackageJson(
  rootDirPath = process.cwd(),
  workingDirPath?: string
): Promise<string | null> {
  if (!workingDirPath) {
    workingDirPath = rootDirPath;
  }

  const normalizedRootDirPath = path.normalize(rootDirPath);
  const normalizedWorkingDirPath = path.normalize(workingDirPath);
  if (normalizedWorkingDirPath.indexOf(normalizedRootDirPath) !== 0) {
    return Promise.reject('Working directory is outside of root directory');
  }

  const packageJsonPath = path.resolve(workingDirPath, 'package.json');
  if (await fileExists(packageJsonPath)) {
    return packageJsonPath;
  }

  const rootDirPathParts = rootDirPath.split(path.sep);
  const workingDirPathParts = workingDirPath.split(path.sep);
  if (workingDirPathParts.length === 1 || workingDirPathParts.length <= rootDirPathParts.length) {
    return null;
  }
  workingDirPathParts.pop();

  return findPackageJson(rootDirPath, workingDirPathParts.join(path.sep));
}

export async function getPackageJsonVersion(packageJsonPath: string): Promise<string> {
  try {
    return (await fs.readJson(packageJsonPath)).version;
  }
  catch (e) {
    return Promise.reject('Unable to read version from package.json');
  }
}

export async function updatePackageJsonVersion(packageJsonPath: string, release: string, options: {
  write?: boolean;
} = {}): Promise<{
  version: string;
  legacyVersion: string;
}> {
  const { write = true } = options;

  console.log(`Updating "${packageJsonPath}"...`);
  let packageJson;
  try {
    packageJson = await fs.readJson(packageJsonPath);
  }
  catch (e) {
    return Promise.reject('Unable to read package.json');
  }

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
