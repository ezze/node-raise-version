import { Argv, Arguments } from 'yargs';

import { releases } from '../../lib/constants';
import raiseVersion from '../../lib/raiseVersion';
import { getRaiseVerRcConfig, convertArgsToConfig } from '../../lib/config';

const createBuilder = async(): Promise<any> => {
  const config = await getRaiseVerRcConfig();

  return (yargs: Argv): Argv => {
    const { changelog, git } = config;

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
        describe: 'Update version in changelog file',
        type: 'boolean',
        default: changelog.enabled
      })
      .option('changelog-path', {
        alias: 'f',
        describe: 'Path to changelog file',
        type: 'string',
        default: changelog.path
      })
      .option('changelog-encoding', {
        alias: 'e',
        describe: 'Encoding of changelog file',
        type: 'string',
        default: changelog.encoding
      })
      .option('changelog-prefix', {
        alias: 'h',
        describe: 'Prefix for version header in changelog file',
        type: 'string',
        default: changelog.prefix
      })
      .option('changelog-bullet', {
        alias: 'b',
        describe: 'Bullet character for changes\' item in changelog file',
        type: 'string',
        default: changelog.bullet
      })
      .option('git', {
        alias: 'g',
        describe: 'Commit updates to git',
        type: 'boolean',
        default: git.enabled
      })
      .option('git-release', {
        alias: 'r',
        describe: 'Git release branch',
        type: 'string',
        default: git.release
      })
      .option('git-development', {
        alias: 'd',
        describe: 'Git development branch',
        type: 'string',
        default: git.development
      })
      .option('git-remote', {
        alias: 'o',
        describe: 'Git remote repository name',
        type: 'string',
        default: git.remote
      })
      .option('git-commit', {
        alias: 'c',
        describe: 'Commit changes to development branch',
        type: 'boolean',
        default: git.commit
      })
      .option('git-merge', {
        alias: 'm',
        describe: 'Merge changes to release branch',
        type: 'boolean',
        default: git.merge
      })
      .option('git-all', {
        alias: 'a',
        describe: 'Commit all changes',
        type: 'boolean',
        default: git.all
      })
      .option('git-tag', {
        alias: 't',
        describe: 'Create git tag',
        type: 'boolean',
        default: git.tag
      })
      .option('git-push', {
        alias: 'p',
        describe: 'Push git changes to remote repository',
        type: 'boolean',
        default: git.push
      });
  };
};

const handler = async(args: Arguments): Promise<void> => {
  const config = await convertArgsToConfig(args as unknown as RaiseVersionArgs);
  await raiseVersion(config);
};

export default { createBuilder, handler };
