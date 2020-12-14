import { Argv } from 'yargs';

import initVersion from '../../lib/initVersion';

const builder = (yargs: Argv): Argv => yargs;
const handler = async(): Promise<void> => {
  await initVersion();
};

export { builder, handler };
