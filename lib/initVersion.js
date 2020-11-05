const { defaultRaiseVerOptions } = require('./constants');
const { detectRaiseVerRcPath, writeRaiseVerRc } = require('./config');
const { fileExists } = require('./utils');

async function initVersion() {
  const raiseVerRcPath = await detectRaiseVerRcPath();
  if (await fileExists(raiseVerRcPath)) {
    console.warn(`File "${raiseVerRcPath}" already exists.`);
    return;
  }
  await writeRaiseVerRc(raiseVerRcPath, defaultRaiseVerOptions);
  return defaultRaiseVerOptions;
}

module.exports = initVersion;
