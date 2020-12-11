import { defaultRaiseVerConfig } from './constants';
import { getRaiseVerRcPath, readRaiseVerRc, writeRaiseVerRc } from './config';
import { fileExists } from './utils';

export async function initVersion(): Promise<RaiseVersionConfig> {
  const raiseVerRcPath = await getRaiseVerRcPath();
  if (raiseVerRcPath && await fileExists(raiseVerRcPath)) {
    console.warn(`File "${raiseVerRcPath}" already exists.`);
    return readRaiseVerRc(raiseVerRcPath);
  }
  else if (raiseVerRcPath) {
    await writeRaiseVerRc(raiseVerRcPath, defaultRaiseVerConfig);
    return defaultRaiseVerConfig;
  }
  else {
    return Promise.reject('Unable to detect a path to .raiseverrc');
  }
}

export default initVersion;
