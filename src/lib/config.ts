import path from 'path';
import fs from 'fs-extra';

import { raiseVerRcName, defaultRaiseVerConfig } from './constants';
import { findPackageJson } from './package';
import { fileExists } from './utils';

export async function detectRaiseVerRcPath(workingDirPath: string = process.cwd()): Promise<string | null> {
  const packageJsonPath = await findPackageJson(workingDirPath);
  if (!packageJsonPath) {
    return null;
  }
  return path.resolve(path.dirname(packageJsonPath), raiseVerRcName);
}

export async function readRaiseVerRc(raiseVerRcPath: string): Promise<any> {
  if (!await fileExists(raiseVerRcPath)) {
    return Promise.reject(`File "${raiseVerRcPath}" doesn't exist`);
  }
  return fs.readJson(raiseVerRcPath);
}

export async function writeRaiseVerRc(raiseVerRcPath: string, config: RaiseVersionConfig): Promise<void> {
  if (await fileExists(raiseVerRcPath)) {
    await fs.remove(raiseVerRcPath);
  }
  return fs.writeJson(raiseVerRcPath, config, { spaces: 2 });
}

export async function getRaiseVerRcConfig(workingDirPath?: string): Promise<RaiseVersionConfig> {
  const raiseVerRcPath = await detectRaiseVerRcPath(workingDirPath);
  if (raiseVerRcPath && await fileExists(raiseVerRcPath)) {
    return readRaiseVerRc(raiseVerRcPath);
  }
  return defaultRaiseVerConfig;
}

export async function convertArgsToConfig(args: RaiseVersionArgs): Promise<RaiseVersionConfig> {
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
  } = args;

  return {
    skipUpdate,
    release,
    changelog: {
      enabled: changelog,
      path: changelogPath,
      encoding: changelogEncoding,
      prefix: changelogPrefix,
      bullet: changelogBullet
    },
    git: {
      enabled: git,
      release: gitRelease,
      development: gitDevelopment,
      remote: gitRemote,
      commit: gitCommit,
      merge: gitMerge,
      all: gitAll,
      tag: gitTag,
      push: gitPush
    }
  };
}
