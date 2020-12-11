import path from 'path';

import {
  getRaiseVerRcPath,
  readRaiseVerRc,
  writeRaiseVerRc,
  getRaiseVerRcConfig,
  convertArgsToConfig
} from '../../src/lib/config';

import {
  createRestoreInitialWorkingDir,
  getTestOurDirPath,
  createTestOutDir,
  createRaiseVerRc,
  loadFixtureFile,
  loadTextFile
} from '../helpers';

describe('config', () => {
  const raiseVerRcName = '.raiseverrc';

  let defaultRaiseVerConfig: RaiseVersionConfig;
  let raiseVerConfig: RaiseVersionConfig;
  beforeAll(async() => {
    defaultRaiseVerConfig = await loadFixtureFile('.raiseverrc-default.json');
    raiseVerConfig = {
      changelog: { ...defaultRaiseVerConfig.changelog, enabled: !defaultRaiseVerConfig.changelog.enabled },
      git: { ...defaultRaiseVerConfig.git, push: !defaultRaiseVerConfig.git.push }
    };
  });

  const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
  afterEach(() => restoreInitialWorkingDir());

  describe('getRaiseVerRcPath', () => {
    it('get path to .raiseverrc file in current working directory', async() => {
      const outDirPath = await createTestOutDir('detect-rc-path-in-working-dir', true);
      expect(await getRaiseVerRcPath()).toBe(path.resolve(outDirPath, raiseVerRcName));
    });

    it('get path to .raiseverrc file in specific directory', async() => {
      const outDirPath = await createTestOutDir('detect-rc-path-in-specific-dir');
      expect(await getRaiseVerRcPath(outDirPath)).toBe(path.resolve(outDirPath, raiseVerRcName));
    });
  });

  describe('readRaiseVerRc', () => {
    it('read .raiseverrc file', async() => {
      const outDirPath = await createTestOutDir('read-rc');
      const raiseVerRcPath = await createRaiseVerRc(outDirPath, defaultRaiseVerConfig);
      expect(await readRaiseVerRc(raiseVerRcPath)).toEqual(defaultRaiseVerConfig);
    });

    it('read non-existing .raiseverrc file', async() => {
      const outDirPath = await createTestOutDir('read-no-rc');
      const raiseVerRcPath = path.resolve(outDirPath, raiseVerRcName);
      await expect(readRaiseVerRc(raiseVerRcPath)).rejects.toBe(`File "${raiseVerRcPath}" doesn't exist`);
    });
  });

  describe('writeRaiseVerRc', () => {
    it('write new .raiseverrc file', async() => {
      const outDirPath = await createTestOutDir('write-rc');
      const raiseVerRcPath = path.resolve(outDirPath, raiseVerRcName);
      await writeRaiseVerRc(raiseVerRcPath, defaultRaiseVerConfig);
      expect(await loadTextFile(raiseVerRcPath)).toEqual(defaultRaiseVerConfig);
    });

    it('overwrite existing .raiseverrc file', async() => {
      const outDirPath = await createTestOutDir('overwrite-rc');
      const raiseVerRcPath = await createRaiseVerRc(outDirPath, defaultRaiseVerConfig);
      await writeRaiseVerRc(raiseVerRcPath, raiseVerConfig);
      expect(await loadTextFile(raiseVerRcPath)).toEqual(raiseVerConfig);
    });
  });

  describe('getRaiseVerRcConfig', () => {
    it('get config from .raiseverrc file', async() => {
      const outDirPath = await createTestOutDir('get-config', true);
      await createRaiseVerRc(outDirPath, raiseVerConfig);
      expect(await getRaiseVerRcConfig()).toEqual(raiseVerConfig);
    });

    it('get default configuration when .raiseverrc file doesn\'t exist', async() => {
      await createTestOutDir('get-default-config', true);
      expect(await getRaiseVerRcConfig()).toEqual(defaultRaiseVerConfig);
    });
  });

  describe('convertArgsToConfig', () => {
    it('convert command line arguments to configuration object', async() => {
      const args: RaiseVersionArgs = await loadFixtureFile('cli-args-default.json');
      expect(await convertArgsToConfig(args)).toEqual(defaultRaiseVerConfig);
    });
  });
});
