const path = require('path');
const fs = require('fs-extra');
const camelcase = require('camelcase');

const { raiseVerRcName, defaultRaiseVerConfig } = require('./constants');
const { findPackageJson } = require('./package');
const { fileExists } = require('./utils');

async function detectRaiseVerRcPath(workingDirectory = process.cwd()) {
  const packageJsonPath = await findPackageJson(workingDirectory);
  if (!packageJsonPath) {
    return Promise.reject('Unable to locate "package.json" file.');
  }
  return path.resolve(path.dirname(packageJsonPath), raiseVerRcName);
}

async function flattenRaiseVerRc(raiseVerRcPath) {
  const result = {};
  let config;
  if (await fileExists(raiseVerRcPath)) {
    config = await readRaiseVerRc(raiseVerRcPath);
  }
  else {
    config = defaultRaiseVerConfig;
  }
  const keys = Object.keys(config);
  keys.forEach(key => {
    const options = config[key] || {};
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
  return result;
}

async function readRaiseVerRc(raiseVerRcPath) {
  if (!await fileExists(raiseVerRcPath)) {
    return Promise.reject(`File "${raiseVerRcPath}" doesn't exist.`);
  }
  return fs.readJson(raiseVerRcPath);
}

async function writeRaiseVerRc(raiseVerRcPath, config) {
  if (await fileExists(raiseVerRcPath)) {
    await fs.remove(raiseVerRcPath);
  }
  return fs.writeJson(raiseVerRcPath, config, { spaces: 2 });
}

module.exports = {
  detectRaiseVerRcPath,
  flattenRaiseVerRc,
  readRaiseVerRc,
  writeRaiseVerRc
};
