import execa from 'execa';
import path from 'path';

declare interface UpdateGitRepositoryVersionOptions extends GitOptionsSoft {
  repoPath?: string;
  packageJsonPath?: string;
  changeLogPath?: string;
  verbose?: boolean;
}

interface GitCommandOptions {
  repoPath?: string;
  verbose?: boolean;
}

async function updateGitRepositoryVersion(version: string, options: UpdateGitRepositoryVersionOptions): Promise<void> {
  const {
    repoPath = process.cwd(),
    packageJsonPath,
    changeLogPath,
    verbose = true,
    release = 'master',
    development = 'develop',
    remote = 'origin',
    commit = true,
    merge = true,
    all = false,
    tag = true,
    push = false
  } = options;

  if (verbose) {
    console.log('Updating git repository...');
  }

  const gitCommandOptions: GitCommandOptions = { repoPath, verbose };

  const current = await gitCurrentBranch(gitCommandOptions);
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
        await gitAdd('-A', gitCommandOptions);
      }
      else {
        const filePaths = [];
        if (packageJsonPath) {
          filePaths.push(packageJsonPath);
        }
        if (changeLogPath) {
          filePaths.push(changeLogPath);
        }
        await gitAdd(filePaths, gitCommandOptions);
      }

      const diffCachedLines = await gitDiffCached(gitCommandOptions);
      if (diffCachedLines.length === 0) {
        return Promise.reject('There is nothing to commit');
      }

      if (gitflow) {
        await gitCommit(`Raise version: ${version}.`, gitCommandOptions);
        developmentCommited = true;
      }
      else {
        await gitCommit(`Version ${version}.`, gitCommandOptions);
        developmentCommited = true;
        if (tag) {
          await gitTag(version, version, gitCommandOptions);
          tagged = true;
        }
      }
    }

    if (gitflow && merge) {
      const stashed = await gitStashAdd(gitCommandOptions);
      await gitCheckout(release, gitCommandOptions);
      await gitMerge(development, `Version ${version}.`, gitCommandOptions);
      releaseCommited = true;
      if (tag) {
        await gitTag(version, version, gitCommandOptions);
        tagged = true;
      }
      await gitCheckout(development, gitCommandOptions);
      if (stashed) {
        await gitStashPop(gitCommandOptions);
      }
    }

    if (push) {
      await gitPush(remote, development, gitCommandOptions);
      if (gitflow && merge) {
        await gitPush(remote, release, gitCommandOptions);
      }
      if (tag) {
        await gitPush(remote, '--tags', gitCommandOptions);
      }
    }
  }
  catch (e) {
    if (verbose) {
      console.error('Some git error is occurred, reverting back everything that is possible:');
      console.error(`- ${release} commited: ${releaseCommited}`);
      console.error(`- ${development} commited: ${developmentCommited}`);
      console.error(`- tagged: ${tagged}`);
    }

    const gitHardReset = async(branch: string) => {
      const stashed = await gitStashAdd(gitCommandOptions);
      const current = await gitCurrentBranch(gitCommandOptions);
      const checkout = current !== branch;
      if (checkout) {
        await gitCheckout(branch, gitCommandOptions);
      }
      await executeGitCommand('reset --hard HEAD~1', gitCommandOptions);
      if (checkout) {
        await gitCheckout(current, gitCommandOptions);
      }
      if (stashed) {
        await gitStashPop(gitCommandOptions);
      }
    };

    if (tagged) {
      await gitRemoveTag(version, gitCommandOptions);
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

async function executeGitCommand(gitCommand: string, options?: GitCommandOptions): Promise<execa.ExecaChildProcess> {
  const { repoPath = process.cwd(), verbose = true } = options || {};

  let relativePath;
  const initialWorkingDirPath = process.cwd();
  if (repoPath !== initialWorkingDirPath) {
    relativePath = path.relative(initialWorkingDirPath, repoPath);
    process.chdir(repoPath);
  }

  const command = `git ${gitCommand}`;
  if (verbose) {
    console.log(`${relativePath ? relativePath : ''}$ ${command}`);
  }
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
    if (verbose) {
      console.error(e);
    }
    return Promise.reject(`Unable to execute command: ${command}`);
  }
  finally {
    if (initialWorkingDirPath) {
      process.chdir(initialWorkingDirPath);
    }
  }
}

async function gitCurrentBranch(options?: GitCommandOptions) {
  const branchCommand = await executeGitCommand('rev-parse --abbrev-ref HEAD', options);
  return branchCommand.stdout.toString();
}

async function gitDiffCached(options?: GitCommandOptions) {
  const command = await executeGitCommand('diff --cached', options);
  return command.stdout ? command.stdout.split('\n') : [];
}

async function gitCheckout(branch: string, options?: GitCommandOptions) {
  return executeGitCommand(`checkout ${branch}`, options);
}

async function gitStashAdd(options?: GitCommandOptions) {
  const beforeCount = (await gitStashList(options)).length;
  await executeGitCommand('stash', options);
  const afterCount = (await gitStashList(options)).length;
  return afterCount > beforeCount;
}

async function gitStashPop(options?: GitCommandOptions) {
  const beforeCount = (await gitStashList(options)).length;
  await executeGitCommand('stash pop', options);
  const afterCount = (await gitStashList(options)).length;
  return afterCount < beforeCount;
}

async function gitStashList(options?: GitCommandOptions) {
  const command = await executeGitCommand('stash list', options);
  return command.stdout ? command.stdout.split('\n') : [];
}

async function gitAdd(filePaths: Array<string> | string, options?: GitCommandOptions) {
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }
  return executeGitCommand(`add ${filePaths.map(filePath => escapeWhitespaces(filePath)).join(' ')}`, options);
}

async function gitCommit(message: string, options?: GitCommandOptions) {
  return executeGitCommand(`commit -m ${escapeWhitespaces(message)}`, options);
}

async function gitMerge(branch: string, message: string, options?: GitCommandOptions) {
  return executeGitCommand(`merge --no-ff ${branch} -m ${escapeWhitespaces(message)}`, options);
}

async function gitTag(version: string, message?: string, options?: GitCommandOptions) {
  return executeGitCommand(`tag -a ${version} -m ${escapeWhitespaces(message ? message : version)}`, options);
}

async function gitRemoveTag(version: string, options?: GitCommandOptions) {
  return executeGitCommand(`tag -d ${version}`, options);
}

async function gitPush(remote: string, entity: string, options?: GitCommandOptions) {
  await executeGitCommand(`push ${remote} ${entity}`, options);
}

function escapeWhitespaces(message: string) {
  return message.replace(/ /g, '\\ ');
}

export {
  updateGitRepositoryVersion
};
