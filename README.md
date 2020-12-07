# node-raise-version

[![NPM version](https://img.shields.io/npm/v/raise-version.svg)](https://www.npmjs.com/package/raise-version)
[![CircleCI](https://circleci.com/gh/ezze/node-raise-version.svg?style=shield)](https://circleci.com/gh/ezze/node-raise-version)
[![codecov](https://codecov.io/gh/ezze/node-raise-version/branch/develop/graph/badge.svg?token=I0ZRW8OP7L)](https://codecov.io/gh/ezze/node-raise-version)
[![Downloads/month](https://img.shields.io/npm/dm/raise-version.svg)](https://www.npmjs.com/package/raise-version)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE.md)

Update and commit package version for Gitflow workflow.

## Installation

```
npm install raise-version --save-dev
```

or

```
yarn add raise-version --dev
```
   
## CLI usage

1. Initialize `raise-version` from the root directory of your project (optional — if missed then default configuration will be used):

    - if installed globally:

        ```
        raise-version init
        ```
      
    - if installed locally:
    
        ```
        npx raise-version init
        ```
      
    `.raiseverrc` configuration file will be created.
 
    `raisever` is an alias for `raise-version` CLI command.
    
2. Adjust configuration parameters in `.raiseverrc`, use `--help` to see a list of available configuration parameters:

    ```
    raise-version --help
    ```

3. Make changes to your source code, describe them in changelog file (if used) and raise a version:

    ```
    raise-version [release] [options]
    ```

    where `release` is one of the following: `major`, `minor`, `patch`.
   
    Options that are not passed in `options` are taken from `.raiseverrc` by default.
   
    Here is an example using default `.raiseverrc` configuration where patch version is updated in `package.json`, prepended as a title with date to bulleted list of changes in `CHANGELOG.md` file, all changes are commited to two Gitflow workflow branches `master` and `develop` and pushed to remote repository:
    
    ```
    raise-version patch --git-push
    ```
    
## Programmatic usage

```javascript
const raiseVersion = require('raise-version');
raiseVersion({
  release: 'patch',
  gitPush: true
}).catch(function(e) {
  console.error('Something went wrong');
});
```
