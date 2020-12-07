import path from 'path';
import moment from 'moment';

import {
  readChangeLog,
  updateChangeLogVersion
} from '../../src/lib/changeLog';

import {
  createTestOutDir,
  loadFixtureFile,
  loadTextFile,
  copyFixtureFile
} from '../helpers';

describe('changeLog', () => {
  describe('readChangeLog', () => {
    const changeLogFixtureBaseName = 'changelog-0.1.0';

    it('read existing changelog file', async() => {
      const outDirPath = await createTestOutDir('read-existing-changelog');
      const changeLogFilePath = await copyFixtureFile(`${changeLogFixtureBaseName}.md`, outDirPath);
      const expectedLines = await loadFixtureFile(`${changeLogFixtureBaseName}.json`);
      expect(await readChangeLog(changeLogFilePath)).toEqual(expectedLines);
      expect(await readChangeLog(changeLogFilePath, { encoding: 'utf-8' })).toEqual(expectedLines);
    });

    it('read non-existing changelog file', async() => {
      const outDirPath = await createTestOutDir('read-non-existing-changelog');
      const changeLofFilePath = path.resolve(outDirPath, 'changelog.md');
      const errorMessage = 'Changelog file doesn\'t exist';
      await expect(readChangeLog(changeLofFilePath)).rejects.toBe(errorMessage);
    });
  });

  describe('updateChangeLogVersion', () => {
    const checkChangeLog = async(changeLogFilePath: string, fixtureFilePath: string, version?: string) => {
      const tokens = { date: moment().format('YYYY-MM-DD') };
      if (version) {
        Object.assign(tokens, { version });
      }
      const expectedLines = await loadFixtureFile(fixtureFilePath, tokens);
      expect(await loadTextFile(changeLogFilePath)).toEqual(expectedLines);
    };

    it('create new changelog file', async() => {
      const version = '0.1.0';
      const outDirPath = await createTestOutDir('new-changelog');
      const changeLogFilePath = path.resolve(outDirPath, 'changelog-new.md');
      await updateChangeLogVersion(changeLogFilePath, version);
      await checkChangeLog(changeLogFilePath, 'changelog-0.1.0-new.json', version);
    });

    it('create new changelog file with custom prefix and bullet', async() => {
      const version = '1.0.0';
      const outDirPath = await createTestOutDir('new-changelog-with-options');
      const changeLogFilePath = path.resolve(outDirPath, 'changelog-new-with-options.md');
      await updateChangeLogVersion(changeLogFilePath, version, { prefix: '#', bullet: '*' });
      await checkChangeLog(changeLogFilePath, 'changelog-1.0.0-new-custom.json', version);
    });

    Object.entries({ major: '1.0.0', minor: '0.2.0', patch: '0.1.1' }).forEach(([release, version]) => {
      it(`${release} version update in changelog file`, async() => {
        const baseName = 'changelog-0.1.0-altered';
        const outDirPath = await createTestOutDir('update-changelog-version');
        const changeLogFilePath = await copyFixtureFile(`${baseName}.md`, outDirPath, `changelog-${version}.md`);
        await updateChangeLogVersion(changeLogFilePath, version);
        await checkChangeLog(changeLogFilePath, `${baseName}.json`, version);
      });
    });

    it('don\'t update the same version', async() => {
      const version = '0.1.0';
      const baseName = 'changelog-0.1.0';
      const outDirPath = await createTestOutDir('the-same-version');
      const changeLogFilePath = await copyFixtureFile(`${baseName}.md`, outDirPath, 'changelog-the-same.md');
      await updateChangeLogVersion(changeLogFilePath, version);
      await checkChangeLog(changeLogFilePath, `${baseName}.json`, version);
    });

    it('don\'t update with version less than the last one', async() => {
      const version = '0.0.1';
      const outDirPath = await createTestOutDir('older-version');
      const changeLogFilePath = await copyFixtureFile('changelog-0.1.0.md', outDirPath, 'changelog-older.md');
      const errorMessage = `Previous version 0.1.0 in changelog file is not less then the new one ${version}`;
      await expect(updateChangeLogVersion(changeLogFilePath, version)).rejects.toBe(errorMessage);
    });

    it('don\'t update when there are not change items for new version', async() => {
      const version = '0.2.0';
      const outDirPath = await createTestOutDir('no-change-items');
      const changeLogFilePath = await copyFixtureFile('changelog-0.1.0.md', outDirPath, 'changelog-no-changes.md');
      const errorMessage = `There is no change list for new version ${version} with bullets "-"`;
      await expect(updateChangeLogVersion(changeLogFilePath, version)).rejects.toBe(errorMessage);
    });
  });
});
