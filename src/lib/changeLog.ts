import fs from 'fs-extra';
import semver from 'semver';
import moment from 'moment';

import { fileExists } from './utils';

export async function readChangeLog(filePath: string, options: {
  encoding?: string;
} = {}): Promise<string[]> {
  const { encoding = 'utf-8' } = options;
  if (!await fileExists(filePath)) {
    return Promise.reject(`Changelog file "${filePath}" doesn't exist.`);
  }
  return (await fs.readFile(filePath, { encoding })).split('\n');
}

export async function updateChangeLogVersion(changeLogPath: string, version: string, options: {
  encoding?: string;
  prefix?: string;
  bullet?: string;
} = {}): Promise<void> {
  console.log(`Updating "${changeLogPath}"...`);

  const { prefix = '##', bullet = '-' } = options;
  const versionRegExp = new RegExp(`^${prefix} (\\d+\\.\\d+\\.\\d+)`);
  const bulletRegExp = new RegExp(`^${bullet} .+$`);

  const newChangeLog = !await fileExists(changeLogPath);
  if (newChangeLog) {
    console.warn('Changelog file doesn\'t exist, let\'s try to create it.');
  }

  const lines = !newChangeLog ? await readChangeLog(changeLogPath, options) : [];

  let versionLineIndex = -1;
  let previousVersion;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const versionMatch = line.match(versionRegExp);
    if (versionMatch) {
      versionLineIndex = i;
      previousVersion = versionMatch[1];
      break;
    }
  }

  if (versionLineIndex < 0) {
    const message = 'There is no previous version\'s header in changelog file.';
    console.warn(message);
    versionLineIndex = lines.length;
  }

  if (previousVersion) {
    if (semver.eq(version, previousVersion)) {
      console.warn(`Changes for version ${version} are already in changelog, skipping update.`);
      return;
    }
    if (!semver.gt(version, previousVersion)) {
      const message = `Previous version ${previousVersion} in changelog file is not less then the new one ${version}.`;
      return Promise.reject(message);
    }
  }

  let bulletStartIndex = -1;
  for (let i = versionLineIndex - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.match(bulletRegExp)) {
      bulletStartIndex = i;
    }
    else if (bulletStartIndex >= 0 && (line.match(versionRegExp) || line.replace('\t', '').trim()) === '') {
      break;
    }
  }
  if (bulletStartIndex < 0) {
    const message = `There is no change list for new version ${version} with bullets "${bullet}".`;
    if (!newChangeLog) {
      return Promise.reject(message);
    }
    lines.push('- Initial release.', '');
    bulletStartIndex = 0;
  }

  lines.splice(bulletStartIndex, 0, `${prefix} ${version} (${moment().format('YYYY-MM-DD')})`, '');
  await fs.writeFile(changeLogPath, lines.join('\n'), options);
  console.log(`Version in "${changeLogPath}" is updated.`);
}
