import { defaultRaiseVerConfig } from './constants';
import { getRaiseVerRcPath, readRaiseVerRc, writeRaiseVerRc } from './config';
import { fileExists } from './utils';

export async function initVersion(): Promise<RaiseVersionConfig> {
  const raiseVerRcPath = await getRaiseVerRcPath();
  if (await fileExists(raiseVerRcPath)) {
    console.warn(`File "${raiseVerRcPath}" already exists`);
    return readRaiseVerRc(raiseVerRcPath);
  }
  else {
    await writeRaiseVerRc(raiseVerRcPath, defaultRaiseVerConfig);
    return defaultRaiseVerConfig;
  }
}

export default initVersion;
