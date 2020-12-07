import path from 'path';

import { fileExists } from '../../src/lib/utils';

import {
  createTestOutDir,
  createFile,
  createDir
} from '../helpers';

describe('utils', () => {
  describe('fileExists', () => {
    it('check that file exists', async() => {
      const outDirPath = await createTestOutDir('file-exists');
      const filePath = path.resolve(outDirPath, 'file');
      await createFile(filePath);
      expect(await fileExists(filePath)).toBe(true);
    });

    it('check that file doesn\'t exist', async() => {
      const outDirPath = await createTestOutDir('file-doesnt-exist');
      const filePath = path.resolve(outDirPath, 'file');
      expect(await fileExists(filePath)).toBe(false);
    });

    it('check that file doesn\'t exist when directory with expected name exists', async() => {
      const outDirPath = await createTestOutDir('dir-exists');
      const dirPath = path.resolve(outDirPath, 'dir');
      await createDir(dirPath);
      expect(await fileExists(dirPath)).toBe(false);
    });
  });
});
