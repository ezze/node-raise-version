import { releases } from './constants';
import { detectRaiseVerRcPath, flattenRaiseVerRc } from './config';
import { findPackageJson, getPackageJsonVersion, updatePackageJsonVersion } from './package';
import { updateChangeLogVersion } from './changeLog';
import { updateGitRepositoryVersion } from './git';

export default async function raiseVersion(options: RaiseVersionOptions): Promise<string> {
  const packageJsonPath = await findPackageJson();
  if (!packageJsonPath) {
    return Promise.reject('Unable to locate "package.json" file');
  }

  const raiseVerRcPath = await detectRaiseVerRcPath();
  const rcOptions = await flattenRaiseVerRc(raiseVerRcPath);

  const {
    skipUpdate,
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
    gitCommit,
    gitMerge,
    gitAll,
    gitTag,
    gitPush
  } = {
    ...rcOptions,
    ...options
  };

  // Updating package.json
  let version, legacyVersion;
  if (skipUpdate) {
    version = legacyVersion = await getPackageJsonVersion(packageJsonPath);
  }
  else if (release) {
    if (!releases.includes(release)) {
      return Promise.reject('Release is invalid');
    }
    ({ version, legacyVersion } = await updatePackageJsonVersion(packageJsonPath, release));
  }
  else {
    return Promise.reject('Release is not specified');
  }

  // Updating changeLog
  if (changelog) {
    try {
      await updateChangeLogVersion(changelogPath, version, {
        encoding: changelogEncoding,
        prefix: changelogPrefix,
        bullet: changelogBullet
      });
    }
    catch (e) {
      console.error('Unable to update changeLog, reverting changes back...');
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
      commit: gitCommit,
      merge: gitMerge,
      all: gitAll,
      tag: gitTag,
      push: gitPush
    });
  }

  return version;
}
