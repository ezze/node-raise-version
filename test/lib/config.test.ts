import path from 'path';

import {
  detectRaiseVerRcPath,
  readRaiseVerRc,
  writeRaiseVerRc,
  getRaiseVerRcConfig,
  convertArgsToConfig
} from '../../src/lib/config';

import {
  createRestoreInitialWorkingDir,
  createTestOutDir,
  createPackageJsonFile,
  createRaiseVerRc,
  loadFixtureFile,
  loadTextFile
} from '../helpers';

describe('config', () => {
  const raiseVerRcName = '.raiseverrc';
  const version = '0.2.0';
  const packageJsonContents = { name: 'test-package', description: 'Test package', version };

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

  describe('detectRaiseVerRcPath', () => {
    it('get path to .raiseverrc file', async() => {
      const outDirPath = await createTestOutDir('detect-rc-path', true);
      await createPackageJsonFile(outDirPath, packageJsonContents);
      const raiseVerRcPath = await createRaiseVerRc(outDirPath, defaultRaiseVerConfig);
      expect(await detectRaiseVerRcPath()).toBe(raiseVerRcPath);
    });

    it('don\'t get path to .raiseverrc file', async() => {
      const outDirPath = await createTestOutDir('no-rc-path', true);
      await createRaiseVerRc(outDirPath, defaultRaiseVerConfig);
      expect(await detectRaiseVerRcPath()).toBe(null);
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
      await createPackageJsonFile(outDirPath, packageJsonContents);
      await createRaiseVerRc(outDirPath, raiseVerConfig);
      expect(await getRaiseVerRcConfig()).toEqual(raiseVerConfig);
    });

    it('get default configuration when .raiseverrc file doesn\'t exist', async() => {
      const outDirPath = await createTestOutDir('get-default-config', true);
      await createPackageJsonFile(outDirPath, packageJsonContents);
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
