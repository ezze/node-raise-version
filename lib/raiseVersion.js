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
    gitRemote,
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

  // Updating git repository
  if (git) {
    await updateGitRepositoryVersion(version, {
      packageJsonPath,
      changeLogPath: changelog ? changelogPath : null,
      release: gitRelease,
      development: gitDevelopment,
      remote: gitRemote,
      tag: gitTag,
      push: gitPush
    });
  }

  return version;
}

module.exports = raiseVersion;
