import path from 'path';
import fs, { ensureDir } from 'fs-extra';
import execa from 'execa';

export const rootTestOutDirPath = path.resolve(__dirname, 'out');
const fixturesDirPath = path.resolve(__dirname, 'fixtures');

export async function createTestOutDir(name?: string, cwd = false): Promise<string> {
  const relativeDirPath = getTestRelativeDirPath();
  let resultPath = path.resolve(rootTestOutDirPath, relativeDirPath);
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

export async function loadFixtureFile(
  relativeFilePath: string,
  tokens?: Record<string, string>
): Promise<any | Array<string>> {
  const filePath = path.resolve(fixturesDirPath, relativeFilePath);
  return loadTextFile(filePath, tokens);
}

export async function loadTextFile(filePath: string, tokens?: Record<string, string>): Promise<any | Array<string>> {
  let contents = await fs.readFile(filePath, { encoding: 'utf-8' });
  if (tokens) {
    Object.entries(tokens).forEach(([name, value]) => {
      contents = contents.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'gm'), value);
    });
  }
  if (path.extname(filePath) === '.json') {
    return JSON.parse(contents);
  }
  return contents.split('\n');
}

export async function copyFixtureFile(
  relativeFilePath: string,
  destDirPath: string,
  fileName?: string
): Promise<string> {
  const filePath = path.resolve(fixturesDirPath, relativeFilePath);
  const destFilePath = path.resolve(destDirPath, fileName ? fileName : path.basename(filePath));
  await fs.copyFile(filePath, destFilePath);
  return destFilePath;
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

function getTestRelativeDirPath() {
  return path.relative(__dirname, expect.getState().testPath).replace('.test.ts', '');
}
