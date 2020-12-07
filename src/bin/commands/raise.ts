import { Argv, Arguments } from 'yargs';

import { releases } from '../../lib/constants';
import raiseVersion from '../../lib/raiseVersion';
import { detectRaiseVerRcPath, flattenRaiseVerRc } from '../../lib/config';

const createBuilder = async(): Promise<any> => {
  const raiseVerRcPath = await detectRaiseVerRcPath();
  const config = await flattenRaiseVerRc(raiseVerRcPath);

  return (yargs: Argv): Argv => {
    const {
      changelog,
      changelogPath,
      changelogEncoding,
      changelogPrefix,
      changelogBullet,
      git,
      gitRelease,
      gitDevelopment,
      gitRemote,
      gitCommit,
      gitMerge,
      gitAll,
      gitTag,
      gitPush
    } = config;

    return yargs
      .positional('release', {
        describe: 'Which part of version to update',
        type: 'string',
        choices: releases
      })
      .option('skip-update', {
        alias: 's',
        describe: 'Don\'t update package.json file'
      })
      .option('changelog', {
        alias: 'l',
        describe: 'Update version in changeLog file',
        type: 'boolean',
        default: changelog
      })
      .option('changelog-path', {
        alias: 'f',
        describe: 'Path to changeLog file',
        type: 'string',
        default: changelogPath
      })
      .option('changelog-encoding', {
        alias: 'e',
        describe: 'Encoding of changeLog file',
        type: 'string',
        default: changelogEncoding
      })
      .option('changelog-prefix', {
        alias: 'h',
        describe: 'Prefix for version header in changeLog file',
        type: 'string',
        default: changelogPrefix
      })
      .option('changelog-bullet', {
        alias: 'b',
        describe: 'Bullet character for changes\' item in changeLog file',
        type: 'string',
        default: changelogBullet
      })
      .option('git', {
        alias: 'g',
        describe: 'Commit updates to git',
        type: 'boolean',
        default: git
      })
      .option('git-release', {
        alias: 'r',
        describe: 'Git release branch',
        type: 'string',
        default: gitRelease
      })
      .option('git-development', {
        alias: 'd',
        describe: 'Git development branch',
        type: 'string',
        default: gitDevelopment
      })
      .option('git-remote', {
        alias: 'o',
        describe: 'Git remote repository name',
        type: 'string',
        default: gitRemote
      })
      .option('git-commit', {
        alias: 'c',
        describe: 'Commit changes to development branch',
        type: 'boolean',
        default: gitCommit
      })
      .option('git-merge', {
        alias: 'm',
        describe: 'Merge changes to release branch',
        type: 'boolean',
        default: gitMerge
      })
      .option('git-all', {
        alias: 'a',
        describe: 'Commit all changes',
        type: 'boolean',
        default: gitAll
      })
      .option('git-tag', {
        alias: 't',
        describe: 'Create git tag',
        type: 'boolean',
        default: gitTag
      })
      .option('git-push', {
        alias: 'p',
        describe: 'Push git changes to remote repository',
        type: 'boolean',
        default: gitPush
      });
  };
};

const handler = async(options: Arguments): Promise<void> => {
  await raiseVersion(options as unknown as RaiseVersionOptions);
};

export default { createBuilder, handler };
