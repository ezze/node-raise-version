const execa = require('execa');

async function updateGitRepositoryVersion(version, options = {}) {
  console.log('Updating git repository...');

  const {
    release = 'master',
    development = 'develop',
    tag = true,
    push = false,
    packageJsonPath,
    changeLogPath
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
  await executeGitCommand(`add ${packageJsonPath}`);
  if (changeLogPath) {
    await executeGitCommand(`add ${changeLogPath}`);
  }

  if (release === development) {
    const commitMessage = `Version ${version}.`;
    await executeGitCommand(`commit -m ${escapeWhitespaces(commitMessage)}`);
    if (tag) {
      await executeGitCommand(`tag -a ${version} -m ${escapeWhitespaces(commitMessage)}`);
    }
  }
  else {
    const commitMessage = `Raise version: ${version}.`;
    await executeGitCommand(`commit -m ${escapeWhitespaces(commitMessage)}`);
    await executeGitCommand(`checkout ${release}`);
    const mergeMessage = `Version ${version}.`;
    await executeGitCommand(`merge --no-ff ${development} -m ${escapeWhitespaces(mergeMessage)}`);
    if (tag) {
      await executeGitCommand(`tag -a ${version} -m ${escapeWhitespaces(commitMessage)}`);
    }
    await executeGitCommand(`checkout ${development}`);
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
