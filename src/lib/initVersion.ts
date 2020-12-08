import { defaultRaiseVerConfig } from './constants';
import { detectRaiseVerRcPath, readRaiseVerRc, writeRaiseVerRc } from './config';
import { fileExists } from './utils';

export async function initVersion(): Promise<RaiseVersionConfig> {
  const raiseVerRcPath = await detectRaiseVerRcPath();
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
