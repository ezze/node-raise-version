import { releases } from './constants';
import { getRaiseVerRcConfig } from './config';
import { findPackageJson, getPackageJsonVersion, updatePackageJsonVersion } from './package';
import { updateChangeLogVersion } from './changeLog';
import { updateGitRepositoryVersion } from './git';

export default async function raiseVersion(config: RaiseVersionConfig): Promise<string> {
  const packageJsonPath = await findPackageJson();
  if (!packageJsonPath) {
    return Promise.reject('Unable to locate "package.json" file');
  }

  const rcConfig = await getRaiseVerRcConfig();
  const { skipUpdate, release } = { ...rcConfig, ...config };
  const changelog = { ...rcConfig.changelog, ...config.changelog };
  const git = { ...rcConfig.git, ...config.git };

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

  // Updating changelog
  if (changelog.enabled) {
    const { path, encoding, prefix, bullet } = changelog;
    try {
      await updateChangeLogVersion(path, version, { encoding, prefix, bullet });
    }
    catch (e) {
      console.error('Unable to update changelog, reverting changes back...');
      await updatePackageJsonVersion(packageJsonPath, legacyVersion);
      throw e;
    }
  }

  // Updating git repository
  if (git) {
    const { path: changeLogPath } = changelog;
    await updateGitRepositoryVersion(version, {
      packageJsonPath,
      changeLogPath: changeLogPath ? changeLogPath : null,
      release: git.release,
      development: git.development,
      remote: git.remote,
      commit: git.commit,
      merge: git.merge,
      all: git.all,
      tag: git.tag,
      push: git.push
    });
  }

  return version;
}
