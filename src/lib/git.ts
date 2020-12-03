import execa from 'execa';

declare interface UpdateGitRepositoryVersionOptions extends GitOptions {
  packageJsonPath: string;
  changeLogPath: string | null;
}

export async function updateGitRepositoryVersion(version: string, options: UpdateGitRepositoryVersionOptions): Promise<void> {
  console.log('Updating git repository...');

  const {
    packageJsonPath,
    changeLogPath,
    release = 'master',
    development = 'develop',
    remote = 'origin',
    commit = true,
    merge = true,
    all = false,
    tag = true,
    push = false
  } = options;

  if (!packageJsonPath) {
    return Promise.reject('Path to package.json is not specified.');
  }

  const current = await gitCurrentBranch();
  if (current !== development) {
    return Promise.reject(
      `Git repository can be updated only from development "${development}" branch, ` +
      `currently on "${current}".`
    );
  }

  const gitflow = release !== development;

  let releaseCommited = false;
  let developmentCommited = false;
  let tagged = false;

  try {
    if (commit) {
      if (all) {
        await gitAdd('-A');
      }
      else {
        const filePaths = [packageJsonPath];
        if (changeLogPath) {
          filePaths.push(changeLogPath);
        }
        await gitAdd(filePaths);
      }

      const diffCachedLines = await gitDiffCached();
      if (diffCachedLines.length === 0) {
        return Promise.reject('There is nothing to commit.');
      }

      if (gitflow) {
        await gitCommit(`Raise version: ${version}.`);
        developmentCommited = true;
      }
      else {
        await gitCommit(`Version ${version}.`);
        developmentCommited = true;
        if (tag) {
          await gitTag(version);
          tagged = true;
        }
      }
    }

    if (gitflow && merge) {
      const stashed = await gitStashAdd();
      await gitCheckout(release);
      await gitMerge(development, `Version ${version}.`);
      releaseCommited = true;
      if (tag) {
        await gitTag(version);
        tagged = true;
      }
      await gitCheckout(development);
      if (stashed) {
        await gitStashPop();
      }
    }

    if (push) {
      await gitPush(remote, development);
      if (gitflow && merge) {
        await gitPush(remote, release);
      }
      if (tag) {
        await gitPush(remote, '--tags');
      }
    }
  }
  catch (e) {
    console.error('Some git error is occurred, reverting back everything that is possible:');
    console.error(`- ${release} commited: ${releaseCommited}`);
    console.error(`- ${development} commited: ${developmentCommited}`);
    console.error(`- tagged: ${tagged}`);

    const gitHardReset = async(branch: string) => {
      const stashed = await gitStashAdd();
      const current = await gitCurrentBranch();
      const checkout = current !== branch;
      if (checkout) {
        await gitCheckout(branch);
      }
      await executeGitCommand('reset --hard HEAD~1');
      if (checkout) {
        await gitCheckout(current);
      }
      if (stashed) {
        await gitStashPop();
      }
    };

    if (tagged) {
      await gitRemoveTag(version);
    }
    if (releaseCommited) {
      await gitHardReset(release);
    }
    if (developmentCommited) {
      await gitHardReset(development);
    }
    throw e;
  }
}

async function executeGitCommand(gitCommand: string): Promise<execa.ExecaChildProcess> {
  const command = `git ${gitCommand}`;
  console.log(`$ ${command}`);
  try {
    const execaCommand = execa.command(command);
    if (execaCommand.stdout) {
      execaCommand.stdout.pipe(process.stdout);
    }
    if (execaCommand.stderr) {
      execaCommand.stderr.pipe(process.stderr);
    }
    await execaCommand;
    return execaCommand;
  }
  catch (e) {
    return Promise.reject(`Unable to execute command: ${command}`);
  }
}

async function gitCurrentBranch() {
  const branchCommand = await executeGitCommand('rev-parse --abbrev-ref HEAD');
  return branchCommand.stdout.toString();
}

async function gitDiffCached() {
  const command = await executeGitCommand('diff --cached');
  return command.stdout ? command.stdout.split('\n') : [];
}

async function gitCheckout(branch: string) {
  return executeGitCommand(`checkout ${branch}`);
}

async function gitStashAdd() {
  const beforeCount = (await gitStashList()).length;
  await executeGitCommand('stash');
  const afterCount = (await gitStashList()).length;
  return afterCount > beforeCount;
}

async function gitStashPop() {
  const beforeCount = (await gitStashList()).length;
  await executeGitCommand('stash pop');
  const afterCount = (await gitStashList()).length;
  return afterCount < beforeCount;
}

async function gitStashList() {
  const command = await executeGitCommand('stash list');
  return command.stdout ? command.stdout.split('\n') : [];
}

async function gitAdd(filePaths: Array<string> | string) {
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }
  return executeGitCommand(`add ${filePaths.map(filePath => escapeWhitespaces(filePath)).join(' ')}`);
}

async function gitCommit(message: string) {
  return executeGitCommand(`commit -m ${escapeWhitespaces(message)}`);
}

async function gitMerge(branch: string, message: string) {
  return executeGitCommand(`merge --no-ff ${branch} -m ${escapeWhitespaces(message)}`);
}

async function gitTag(version: string, message?: string) {
  return executeGitCommand(`tag -a ${version} -m ${escapeWhitespaces(message ? message : version)}`);
}

async function gitRemoveTag(version: string) {
  return executeGitCommand(`tag -d ${version}`);
}

async function gitPush(remote: string, entity: string) {
  await executeGitCommand(`push ${remote} ${entity}`);
}

function escapeWhitespaces(message: string) {
  return message.replace(/ /g, '\\ ');
}
