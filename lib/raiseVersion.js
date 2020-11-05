const { releases } = require('./constants');
const { detectRaiseVerRcPath, flattenRaiseVerRc } = require('./config');
const { findPackageJson, getPackageJsonVersion, updatePackageJsonVersion } = require('./package');
const { updateChangeLogVersion } = require('./changeLog');
const { updateGitRepositoryVersion } = require('./git');

async function raiseVersion(options) {
  const packageJsonPath = await findPackageJson();
  if (!packageJsonPath) {
    return Promise.reject('Unable to locate "package.js" file.');
  }

  const raiseVerRcPath = await detectRaiseVerRcPath();
  const rcOptions = await flattenRaiseVerRc(raiseVerRcPath);

  const {
    release,
    changelog,
    changelogPath,
    changelogEncoding,
    changelogPrefix,
    changelogBullet,
    git,
    gitRelease,
    gitDevelopment,
    gitTag,
    gitPush,
    skipPackage
  } = {
    ...rcOptions,
    ...options
  };

  if (!releases.includes(release)) {
    return Promise.reject('Release is not specified or invalid.');
  }

  // Updating package.json
  let version;
  if (skipPackage) {
    version = await getPackageJsonVersion(packageJsonPath);
  }
  else {
    version = await updatePackageJsonVersion(packageJsonPath, release);
  }

  // Updating changelog
  if (changelog) {
    await updateChangeLogVersion(changelogPath, version, {
      encoding: changelogEncoding,
      prefix: changelogPrefix,
      bullet: changelogBullet
    });
  }

  // Updating repository
  if (git) {
    await updateGitRepositoryVersion(version, {
      release: gitRelease,
      development: gitDevelopment,
      tag: gitTag,
      push: gitPush,
      packageJsonPath,
      changeLogPath: changelog ? changelogPath : null
    });
  }

  return version;
}

module.exports = raiseVersion;
