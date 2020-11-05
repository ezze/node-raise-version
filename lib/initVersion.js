const { defaultRaiseVerConfig } = require('./constants');
const { detectRaiseVerRcPath, writeRaiseVerRc } = require('./config');
const { fileExists } = require('./utils');

async function initVersion() {
  const raiseVerRcPath = await detectRaiseVerRcPath();
  if (await fileExists(raiseVerRcPath)) {
    console.warn(`File "${raiseVerRcPath}" already exists.`);
    return;
  }
  await writeRaiseVerRc(raiseVerRcPath, defaultRaiseVerConfig);
  return defaultRaiseVerConfig;
}

module.exports = initVersion;
