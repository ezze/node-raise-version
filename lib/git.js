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

  const branchCommand = await executeGitCommand('rev-parse --abbrev-ref HEAD');
  const current = branchCommand.stdout.toString();
  if (current !== development) {
    return Promise.reject(
      `Git repository can be updated only from development "${development}" branch, ` +
      `currently on "${branchCommand.stdout}".`
    );
  }

  let releaseCommited = false;
  let developmentCommited = false;
  let tagged = false;

  try {
    await executeGitCommand(`add ${packageJsonPath}`);
    if (changeLogPath) {
      await executeGitCommand(`add ${changeLogPath}`);
    }

    if (release === development) {
      const commitMessage = `Version ${version}.`;
      await executeGitCommand(`commit -m ${escapeWhitespaces(commitMessage)}`);
      developmentCommited = true;
      if (tag) {
        await executeGitCommand(`tag -a ${version} -m ${escapeWhitespaces(commitMessage)}`);
        tagged = true;
      }
    }
    else {
      const commitMessage = `Raise version: ${version}.`;
      await executeGitCommand(`commit -m ${escapeWhitespaces(commitMessage)}`);
      developmentCommited = true;
      await executeGitCommand(`checkout ${release}`);
      const mergeMessage = `Version ${version}.`;
      await executeGitCommand(`merge --no-ff ${development} -m ${escapeWhitespaces(mergeMessage)}`);
      releaseCommited = true;
      if (tag) {
        await executeGitCommand(`tag -a ${version} -m ${escapeWhitespaces(commitMessage)}`);
        tagged = true;
      }
      if (push) {
        await executeGitCommand(`push ${remote} ${release}`);
      }
      await executeGitCommand(`checkout ${development}`);
    }

    if (push) {
      await executeGitCommand(`push ${remote} ${development}`);
      if (tag) {
        await executeGitCommand(`push ${remote} --tags`);
      }
    }
  }
  catch (e) {
    console.error('Some git error is occurred, reverting back everything that is possible...');
    if (tagged) {
      await executeGitCommand(`tag -d ${version}`);
    }
    if (releaseCommited) {
      await executeGitCommand(`checkout ${release}`);
      await executeGitCommand('reset --hard HEAD~1');
    }
    if (developmentCommited) {
      await executeGitCommand(`checkout ${development}`);
      await executeGitCommand('reset --hard HEAD~1');
    }
    throw e;
  }
}

async function executeGitCommand(gitCommand) {
  try {
    const command = `git ${gitCommand}`;
    console.log(`$ ${command}`);
    const execaCommand = execa.command(command);
    execaCommand.stdout.pipe(process.stdout);
    execaCommand.stderr.pipe(process.stderr);
    await execaCommand;
    return execaCommand;
  }
  catch (e) {
    return Promise.reject('Unable to execute git command.');
  }
}

function escapeWhitespaces(message) {
  return message.replace(/ /g, '\\ ');
}

module.exports = {
  updateGitRepositoryVersion
};
