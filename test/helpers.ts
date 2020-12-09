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

export async function createPackageJsonFile(dirPath: string, contents: { [key: string]: any }): Promise<string> {
  const packageJsonPath = path.resolve(dirPath, 'package.json');
  await fs.writeJSON(packageJsonPath, contents, { encoding: 'utf-8', spaces: 2 });
  return packageJsonPath;
}

export async function createChangeLogFile(dirPath: string, contents: Array<string>,): Promise<string> {
  const changeLogPath = path.resolve(dirPath, 'CHANGELOG.md');
  await fs.writeFile(changeLogPath, contents.join('\n'), { encoding: 'utf-8' });
  return changeLogPath;
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

export async function createBranch(repoPath: string, branch: string, commit?: string): Promise<void> {
  await exec(`git checkout -b ${branch}${commit ? ` ${commit}` : ''}`, repoPath);
}

export async function checkoutBranch(repoPath: string, branch: string): Promise<void> {
  await exec(`git checkout ${branch}`, repoPath);
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

export function getCommitRef(branch: string, parents?: Array<string>): string {
  return `${branch}${parents ? parents.join('') : ''}`;
}

export async function getCommitMessage(repoPath: string, commitRef: string): Promise<string> {
  const execaCommand = await exec(`git show-branch --no-name ${commitRef}`, repoPath);
  return execaCommand.stdout;
}

export async function getCommitDiff(repoPath: string, commitRef1: string, commitRef2: string): Promise<Array<string>> {
  const execaCommand = await exec(`git diff ${commitRef1} ${commitRef2}`, repoPath);
  return execaCommand.stdout.split('\n');
}

export function extractFileDiff(diff: Array<string>, fileName: string): Array<string> {
  const fileDiff: Array<string> = [];
  let fileFound = false;
  let diffStarted = false;
  for (let i = 0; i < diff.length; i++) {
    const line = diff[i];
    const newDiff = line.startsWith('diff --git');
    if (newDiff) {
      if (fileFound) {
        break;
      }
      if (line === `diff --git a/${fileName} b/${fileName}`) {
        fileFound = true;
      }
    }
    else if (fileFound) {
      if (line.startsWith('@@')) {
        diffStarted = true;
      }
      else if (diffStarted) {
        fileDiff.push(line);
      }
    }
  }
  return fileDiff;
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
    contents = applyTokensToLine(contents, tokens, true);
  }
  if (path.extname(filePath) === '.json' || path.basename(filePath) === '.raiseverrc') {
    return JSON.parse(contents);
  }
  return contents.split('\n');
}

export function applyTokens(
  item: string | Array<string> | Record<string, any>,
  tokens: Record<string, string>
): any {
  if (typeof item === 'string') {
    return applyTokensToLine(item, tokens);
  }
  if (Array.isArray(item)) {
    return applyTokensToLines(item, tokens);
  }
  if (typeof item === 'object') {
    const result: Record<string, any> = {};
    Object.entries(item).forEach(([name, value]) => {
      result[name] = applyTokens(value, tokens);
    });
    return result;
  }
  return item;
}

function applyTokensToLine(line: string, tokens: Record<string, string>, multiline = false): string {
  Object.entries(tokens).forEach(([name, value]) => {
    line = line.replace(new RegExp(`\\{\\{${name}\\}\\}`, `g${multiline ? 'm' : ''}`), value);
  });
  return line;
}

function applyTokensToLines(lines: Array<string>, tokens: Record<string, string>) {
  return lines.map(line => applyTokensToLine(line, tokens));
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
