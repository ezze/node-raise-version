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

export async function createPackageJson(dirPath: string, contents: { [key: string]: any }): Promise<string> {
  const packageJsonPath = path.resolve(dirPath, 'package.json');
  await fs.writeJSON(packageJsonPath, contents, { encoding: 'utf-8', spaces: 2 });
  return packageJsonPath;
}

export async function createRaiseVerRc(dirPath: string, contents: RaiseVersionConfig): Promise<string> {
  const raiseVerRcPath = path.resolve(dirPath, '.raiseverrc');
  await fs.writeJSON(raiseVerRcPath, contents, { encoding: 'utf-8', spaces: 2 });
  return raiseVerRcPath;
}

export async function createRepository(dirPath: string, options?: {
  dirName?: string;
  bare?: boolean;
  initialCommit?: boolean;
}): Promise<string> {
  const { dirName, bare = false, initialCommit = false } = options || {};
  const repoDirPath = path.resolve(dirPath, dirName ? dirName : (bare ? 'repo-bare' : 'repo'));
  await exec(`git init ${repoDirPath}${bare ? ' --bare' : ''}`);
  if (initialCommit) {
    await exec('git commit --allow-empty -m Initial\\ commit.', repoDirPath);
  }
  return repoDirPath;
}

export async function createBranch(repoPath: string, branchName: string): Promise<void> {

}

export async function addRemoteRepository(
  repoPath: string,
  remoteRepoPath: string,
  remoteName = 'origin'
): Promise<void> {
  await exec(`git remote add ${remoteName} ${remoteRepoPath}`, repoPath);
}

export async function commitAll(repoPath: string, message: string): Promise<void> {
  await exec('git add -A', repoPath);
  await exec(`git commit -m ${escapeWhitespaces(message)}`, repoPath);
}

function escapeWhitespaces(message: string) {
  return message.replace(/ /g, '\\ ');
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
  if (path.extname(filePath) === '.json' || path.basename(filePath) === '.raiseverrc') {
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

export async function exec(command: string, workingDirPath?: string): Promise<execa.ExecaChildProcess> {
  let relativePath = '';
  const restoreInitialWorkingDir = createRestoreInitialWorkingDir();
  if (workingDirPath) {
    relativePath = path.relative(process.cwd(), workingDirPath);
    process.chdir(workingDirPath);
  }

  try {
    console.log(`${relativePath}$ ${command}`);
    const execaCommand = execa.command(command);
    if (execaCommand.stdout) {
      execaCommand.stdout.pipe(process.stdout);
    }
    if (execaCommand.stderr) {
      execaCommand.stderr.pipe(process.stderr);
    }
    await execaCommand;
    if (workingDirPath) {
      restoreInitialWorkingDir();
    }
    return execaCommand;
  }
  catch (e) {
    console.error(e);
    return Promise.reject(`Unable to execute a command: "${command}"`);
  }
}

function getTestRelativeDirPath() {
  return path.relative(__dirname, expect.getState().testPath).replace('.test.ts', '');
}
