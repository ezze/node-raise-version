import path from 'path';
import fs from 'fs-extra';
import camelcase from 'camelcase';

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
  const result: Record<string, any> = {};
  let config: RaiseVersionConfig;
  if (await fileExists(raiseVerRcPath)) {
    config = await readRaiseVerRc(raiseVerRcPath);
  }
  else {
    config = defaultRaiseVerConfig;
  }
  const keys = Object.keys(config);
  keys.forEach(key => {
    const options = (config as any)[key] || {};
    const names = Object.keys(options);
    names.forEach(name => {
      const value = options[name];
      if (name === 'enabled') {
        result[key] = value;
      }
      else {
        result[`${key}${camelcase(name, { pascalCase: true })}`] = value;
      }
    });
  });
  return result as RaiseVersionOptions;
}
