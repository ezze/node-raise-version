import fs from 'fs-extra';

import { rootTestOutDirPath } from './helpers';

beforeAll(async() => {
  await fs.emptyDir(rootTestOutDirPath);
});
