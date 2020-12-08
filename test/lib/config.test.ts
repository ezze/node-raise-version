import { defaultRaiseVerConfig } from '../../src/lib/constants';

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
  createPackageJson,
  createRaiseVerRc
} from '../helpers';

describe('config', () => {
  const version = '0.2.0';
  const packageJsonContents = { name: 'test-package', description: 'Test package', version };

  const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
  afterEach(() => restoreInitialWorkingDir());

  describe('detectRaiseVerRcPath', () => {
    it('get path to .raiseverrc', async() => {
      const outDirPath = await createTestOutDir('detect-rc-path', true);
      await createPackageJson(outDirPath, packageJsonContents);
      const raiseVerRcPath = await createRaiseVerRc(outDirPath, defaultRaiseVerConfig);
      expect(await detectRaiseVerRcPath()).toBe(raiseVerRcPath);
    });

    it('don\'t get path to .raiseverrc', async() => {
      const outDirPath = await createTestOutDir('no-rc-path', true);
      await createRaiseVerRc(outDirPath, defaultRaiseVerConfig);
      expect(await detectRaiseVerRcPath()).toBe(null);
    });
  });
});
