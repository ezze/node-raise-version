#!/usr/bin/env node
import yargs from 'yargs';

import init from './commands/init';
import raise from './commands/raise';

(async() => {
  yargs
    .command('init', 'Create default .raiseverrc configuration file', init.builder, init.handler)
    .command('* [release] [options]', 'Raise version', await raise.createBuilder(), raise.handler)
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
