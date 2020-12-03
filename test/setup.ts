import fs from 'fs-extra';

import { rootTestOutPath } from './helpers';

beforeAll(async() => {
  await fs.emptyDir(rootTestOutPath);
});
