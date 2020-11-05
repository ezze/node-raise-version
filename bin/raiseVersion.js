#!/usr/bin/env node
const yargs = require('yargs');
const raiseVersion = require('../lib/raiseVersion');
const { releases } = require('../lib/constants');

yargs
  .command('* <release> [options]', 'Raise version', yargs => {
    return yargs.positional('release', {
      describe: 'Which part of version to update',
      type: 'string',
      choices: releases
    });
  }, options => raiseVersion(options))
  .wrap(null)
  .strict(true)
  .fail(e => console.error(e))
  .demandCommand()
  .parse(process.argv.slice(2));
