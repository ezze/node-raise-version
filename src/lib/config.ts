import path from 'path';
import fs from 'fs-extra';

import { raiseVerRcName, defaultRaiseVerConfig } from './constants';
import { fileExists } from './utils';

export async function getRaiseVerRcPath(workingDirPath = process.cwd()): Promise<string> {
  return path.resolve(workingDirPath, raiseVerRcName);
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
  const raiseVerRcPath = await getRaiseVerRcPath(workingDirPath);
  if (await fileExists(raiseVerRcPath)) {
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
