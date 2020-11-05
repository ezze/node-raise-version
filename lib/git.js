const execa = require('execa');

async function updateGitRepositoryVersion(version, options = {}) {
  console.log('Updating git repository...');

  const {
    packageJsonPath,
    changeLogPath,
    release = 'master',
    development = 'develop',
    remote = 'origin',
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

  let releaseCommited = false;
  let developmentCommited = false;
  let tagged = false;

  try {
    const filePaths = [packageJsonPath];
    if (changeLogPath) {
      filePaths.push(changeLogPath);
    }
    await gitAdd(filePaths);

    const diffCachedLines = await gitDiffCached();
    if (diffCachedLines.length === 0) {
      console.warn('There is nothing to commit.');
    }
    else {
      if (release === development) {
        await gitCommit(`Version ${version}.`);
        developmentCommited = true;
        if (tag) {
          await gitTag(version);
          tagged = true;
        }
      }
      else {
        await gitCommit(`Raise version: ${version}.`);
        developmentCommited = true;
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
    }

    if (push) {
      if (releaseCommited) {
        await gitPush(remote, release);
      }
      if (developmentCommited) {
        await gitPush(remote, development);
      }
      if (tagged) {
        await gitPush(remote, '--tags');
      }
    }
  }
  catch (e) {
    console.error('Some git error is occurred, reverting back everything that is possible:');
    console.error(`- ${release} commited: ${releaseCommited}`);
    console.error(`- ${development} commited: ${developmentCommited}`);
    console.error(`- tagged: ${tagged}`);

    const gitHardReset = async branch => {
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

async function executeGitCommand(gitCommand) {
  const command = `git ${gitCommand}`;
  console.log(`$ ${command}`);
  try {
    const execaCommand = execa.command(command);
    execaCommand.stdout.pipe(process.stdout);
    execaCommand.stderr.pipe(process.stderr);
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

async function gitCheckout(branch) {
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

async function gitAdd(filePaths) {
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }
  return executeGitCommand(`add ${filePaths.map(filePath => escapeWhitespaces(filePath)).join(' ')}`);
}

async function gitCommit(message) {
  return executeGitCommand(`commit -m ${escapeWhitespaces(message)}`);
}

async function gitMerge(branch, message) {
  return executeGitCommand(`merge --no-ff ${branch} -m ${escapeWhitespaces(message)}`);
}

async function gitTag(version, message) {
  return executeGitCommand(`tag -a ${version} -m ${escapeWhitespaces(message ? message : version)}`);
}

async function gitRemoveTag(version) {
  return executeGitCommand(`tag -d ${version}`);
}

async function gitPush(remote, entity) {
  await executeGitCommand(`push ${remote} ${entity}`);
}

function escapeWhitespaces(message) {
  return message.replace(/ /g, '\\ ');
}

module.exports = {
  updateGitRepositoryVersion
};
