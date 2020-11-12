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
    gitAll,
    gitTag,
    gitPush,
    skipUpdate
  } = {
    ...rcOptions,
    ...options
  };

  // Updating package.json
  let version, legacyVersion;
  if (skipUpdate) {
    version = legacyVersion = await getPackageJsonVersion(packageJsonPath);
  }
  else {
    if (!releases.includes(release)) {
      return Promise.reject('Release is not specified or invalid.');
    }
    ({ version, legacyVersion } = await updatePackageJsonVersion(packageJsonPath, release));
  }

  // Updating changelog
  if (changelog) {
    try {
      await updateChangeLogVersion(changelogPath, version, {
        encoding: changelogEncoding,
        prefix: changelogPrefix,
        bullet: changelogBullet
      });
    }
    catch (e) {
      console.error('Unable to update changelog, reverting changes back...');
      await updatePackageJsonVersion(packageJsonPath, legacyVersion);
      throw e;
    }
  }

  // Updating git repository
  if (git) {
    await updateGitRepositoryVersion(version, {
      packageJsonPath,
      changeLogPath: changelog ? changelogPath : null,
      release: gitRelease,
      development: gitDevelopment,
      remote: gitRemote,
      all: gitAll,
      tag: gitTag,
      push: gitPush
    });
  }

  return version;
}

module.exports = raiseVersion;
