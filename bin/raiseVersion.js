#!/usr/bin/env node
const yargs = require('yargs');

const initVersion = require('../lib/initVersion');
const raiseVersion = require('../lib/raiseVersion');

const { releases } = require('../lib/constants');
const { detectRaiseVerRcPath, flattenRaiseVerRc } = require('../lib/config');

(async() => {
  const raiseVerRcPath = await detectRaiseVerRcPath();
  const config = await flattenRaiseVerRc(raiseVerRcPath);

  yargs
    .command('* <release> [options]', 'Raise version', yargs => {
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
        gitTag,
        gitPush
      } = config;

      return yargs
        .positional('release', {
          describe: 'Which part of version to update',
          type: 'string',
          choices: releases
        })
        .option('changelog', {
          alias: 'c',
          describe: 'Update version in changelog file',
          type: 'boolean',
          default: changelog
        })
        .option('changelog-path', {
          alias: 'f',
          describe: 'Path to changelog file',
          type: 'string',
          default: changelogPath
        })
        .option('changelog-encoding', {
          alias: 'e',
          describe: 'Encoding of changelog file',
          type: 'string',
          default: changelogEncoding
        })
        .option('changelog-prefix', {
          alias: 'h',
          describe: 'Prefix for version header in changelog file',
          type: 'string',
          default: changelogPrefix
        })
        .option('changelog-bullet', {
          alias: 'b',
          describe: 'Bullet character for changes\' item in changelog file',
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
        })
        .option('skip-package', {
          alias: 's',
          describe: 'Don\'t update package.json file'
        });
    }, options => raiseVersion(options))
    .command('init', 'Create default .raiseverrc configuration file', () => {}, () => initVersion())
    .wrap(null)
    .strict(true)
    .fail((message, error) => {
      if (message) {
        console.error(message);
      }
      console.error(error);
      process.exit(1);
    })
    .demandCommand()
    .parse(process.argv.slice(2));
})();
