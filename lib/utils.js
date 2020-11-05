const fs = require('fs-extra');

async function fileExists(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  }
  catch (e) {
    return false;
  }
}

module.exports = {
  fileExists
};
