import fs from 'fs-extra';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    return (await fs.stat(filePath)).isFile();
  }
  catch (e) {
    return false;
  }
}
