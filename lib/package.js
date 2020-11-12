const path = require('path');
const fs = require('fs-extra');
const semver = require('semver');

const { releases } = require('./constants');
const { fileExists } = require('./utils');

async function findPackageJson(workingDirectoryPath = process.cwd()) {
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

async function getPackageJsonVersion(packageJsonPath) {
  const packageJson = await fs.readJson(packageJsonPath);
  return packageJson.version;
}

async function updatePackageJsonVersion(packageJsonPath, release, options = {}) {
  const { write = true } = options;

  console.log(`Updating "${packageJsonPath}"...`);

  const packageJson = await fs.readJson(packageJsonPath);
  const { version: legacyVersion } = packageJson;
  if (!semver.valid(legacyVersion)) {
    return Promise.reject('Version property is not specified or invalid.');
  }

  const version = semver.valid(release) ? release : semver.inc(legacyVersion, release);
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

module.exports = {
  findPackageJson,
  getPackageJsonVersion,
  updatePackageJsonVersion
};
