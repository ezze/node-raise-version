import path from 'path';
import fs, { ensureDir } from 'fs-extra';
import execa from 'execa';

export const rootTestOutPath = path.resolve(__dirname, 'out');

export async function createTestOutDir(name?: string, cwd = false): Promise<string> {
  const relativePath = path.relative(__dirname, expect.getState().testPath).replace('.test.ts', '');
  let resultPath = path.resolve(rootTestOutPath, relativePath);
  if (name) {
    resultPath = path.resolve(resultPath, name);
  }
  await fs.ensureDir(resultPath);
  if (cwd) {
    process.chdir(resultPath);
  }
  return resultPath;
}

export async function createFile(filePath: string): Promise<string> {
  const file = await fs.open(filePath, 'w');
  await fs.close(file);
  return filePath;
}

export async function createDir(dirPath: string): Promise<string> {
  await ensureDir(dirPath);
  return dirPath;
}

export function createRestoreInitialWorkingDir(): Function {
  const initialDirPath = process.cwd();
  return () => process.chdir(initialDirPath);
}

export async function exec(command: string): Promise<void> {
  try {
    await execa.command(command);
  }
  catch (e) {
    console.error(e);
    return Promise.reject(`Unable to execute a command: "${command}"`);
  }
}
