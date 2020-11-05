# node-raise-version

Update and publish package version for Gitflow worflow.

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
        npx raise-version init
        ```
      
    - if installed locally:
    
        ```
        raise-version init
        ```
      
    `.raiseverrc` configuration file will be created.
 
    `raisever` is an alias for `raise-version` CLI command.
    
2. Adjust configuration parameters in `.raiseverrc`, use `--help` to see a list of available configuration parameters:

    ```
    raise-version --help
    ```

3. Make changes to your source code, describe them in changelog file (if used) and raise a version:

    ```
    raise-version <release> [options]
    ```
   
    Here is an example using default `.raiseverrc` configuration where patch version is updated in `package.json`, prepended as a title with date to bulleted list of changes in `CHANGELOG.md` file, all changes are commited to two Gitflow workflow branches `master` and `develop` and pushed to remote repository:
    
    ```
    raise-version patch --git-push
    ```
    
