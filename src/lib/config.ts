import path from 'path';
import fs from 'fs-extra';

import { raiseVerRcName, defaultRaiseVerConfig } from './constants';
import { findPackageJson } from './package';
import { fileExists } from './utils';

export async function detectRaiseVerRcPath(workingDirPath: string = process.cwd()): Promise<string> {
  const packageJsonPath = await findPackageJson(workingDirPath);
  if (!packageJsonPath) {
    return Promise.reject('Unable to locate package.json file.');
  }
  return path.resolve(path.dirname(packageJsonPath), raiseVerRcName);
}

export async function readRaiseVerRc(raiseVerRcPath: string): Promise<any> {
  if (!await fileExists(raiseVerRcPath)) {
    return Promise.reject(`File "${raiseVerRcPath}" doesn't exist.`);
  }
  return fs.readJson(raiseVerRcPath);
}

export async function writeRaiseVerRc(raiseVerRcPath: string, config: RaiseVersionConfig): Promise<void> {
  if (await fileExists(raiseVerRcPath)) {
    await fs.remove(raiseVerRcPath);
  }
  return fs.writeJson(raiseVerRcPath, config, { spaces: 2 });
}

export async function flattenRaiseVerRc(raiseVerRcPath: string): Promise<RaiseVersionOptions> {
  let config: RaiseVersionConfig;
  if (await fileExists(raiseVerRcPath)) {
    config = await readRaiseVerRc(raiseVerRcPath);
  }
  else {
    config = defaultRaiseVerConfig;
  }
  const { changelog, git } = config;
  return {
    changelog: changelog.enabled,
    changelogPath: changelog.path,
    changelogEncoding: changelog.encoding,
    changelogPrefix: changelog.prefix,
    changelogBullet: changelog.bullet,
    git: git.enabled,
    gitRelease: git.release,
    gitDevelopment: git.development,
    gitRemote: git.remote,
    gitCommit: git.commit,
    gitMerge: git.merge,
    gitAll: git.all,
    gitTag: git.tag,
    gitPush: git.push
  };
}
