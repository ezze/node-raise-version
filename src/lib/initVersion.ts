import { defaultRaiseVerConfig } from './constants';
import { detectRaiseVerRcPath, writeRaiseVerRc } from './config';
import { fileExists } from './utils';

export async function initVersion(): Promise<RaiseVersionConfig> {
  const raiseVerRcPath = await detectRaiseVerRcPath();
  if (await fileExists(raiseVerRcPath)) {
    console.warn(`File "${raiseVerRcPath}" already exists.`);
  }
  else {
    await writeRaiseVerRc(raiseVerRcPath, defaultRaiseVerConfig);
  }
  return defaultRaiseVerConfig;
}

export default initVersion;
