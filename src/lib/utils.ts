import fs from 'fs-extra';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    return (await fs.stat(filePath)).isFile();
  }
  catch (e) {
    return false;
  }
}

export {
  fileExists
};
