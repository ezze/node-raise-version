import path from 'path';

import { fileExists } from '../../src/lib/utils';

import {
  createOutDir,
  createFile,
  createDir
} from '../helpers';

describe('utils', () => {
  describe('fileExists', () => {
    it('check that file exists', async() => {
      const outDirPath = await createOutDir('file-exists');
      const filePath = path.resolve(outDirPath, 'file');
      await createFile(filePath);
      expect(await fileExists(filePath)).toBe(true);
    });

    it('check that file doesn\'t exist', async() => {
      const outDirPath = await createOutDir('file-doesnt-exist');
      const filePath = path.resolve(outDirPath, 'file');
      expect(await fileExists(filePath)).toBe(false);
    });

    it('check that file doesn\'t exist when directory with expected name exists', async() => {
      const outDirPath = await createOutDir('dir-exists');
      const dirPath = path.resolve(outDirPath, 'dir');
      await createDir(dirPath);
      expect(await fileExists(dirPath)).toBe(false);
    });
  });
});
