const path = require('path');
const semver = require('semver');
const fs = require('fs-extra');

const { releases } = require('./constants');

async function raiseVersion(options) {
  const { release } = options;
  if (!releases.includes(release)) {
    return Promise.reject('Release is not specified or invalid.');
  }

  const packageJsonPath = await findPackageJson();
  if (!packageJsonPath) {
    return Promise.reject('Unable to locate "package.json" file.');
  }

  await updatePackageJsonVersion(packageJsonPath, release);
}

async function findPackageJson(workingDirectoryPath = process.cwd()) {
  const packageJsonPath = path.resolve(workingDirectoryPath, 'package.json');
  const stats = await fs.stat(packageJsonPath);
  if (stats.isFile()) {
    return packageJsonPath;
  }
  const pathParts = workingDirectoryPath.split(path.sep);
  if (pathParts.length === 1) {
    return null;
  }
  pathParts.pop();
  return findPackageJson(pathParts.join(path.sep));
}

async function updatePackageJsonVersion(packageJsonPath, release) {
  console.log(`Updating ${packageJsonPath}...`);

  const packageJson = await fs.readJson(packageJsonPath);
  const { version } = packageJson;
  if (!semver.valid(version)) {
    return Promise.reject('Version property is not specified or invalid.');
  }

  const newVersion = semver.inc(version, release);
  console.log(`${release}: ${version} => ${newVersion}`);
  packageJson.version = newVersion;
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  console.log('Version in "package.json" is updated.');
}

module.exports = raiseVersion;
