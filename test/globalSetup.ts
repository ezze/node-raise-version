import fs from 'fs-extra';

import { rootTestOutDirPath } from './helpers';

export default async function setup(): Promise<void> {
  await fs.emptyDir(rootTestOutDirPath);
}
