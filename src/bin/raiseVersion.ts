import yargs from 'yargs';

import * as init from './commands/init';
import * as raise from './commands/raise';

import fail from './fail';

async function raiseVersion(): Promise<void> {
  yargs
    .command('init', 'Create default .raiseverrc configuration file', init.builder, init.handler)
    .command('* [release] [options]', 'Raise version', await raise.createBuilder(), raise.handler)
    .wrap(null)
    .strict(true)
    .fail(fail)
    .demandCommand()
    .parse(process.argv.slice(2));
}

export = raiseVersion;
