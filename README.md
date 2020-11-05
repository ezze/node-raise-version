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

1. Initialize `raise-version` from the root directory of your project:

    - if installed globally:

        ```
        npx raise-version init
        ```
      
    - if installed locally:
    
        ```
        raise-version init
        ```
 
    `raisever` is an alias for `raise-version` CLI command.

    `.raiseverrc` configuration file will be created.
    
2. Adjust configuration parameters in `.raiseverrc`, use `--help` to see a list of available configuration parameters:

    ```
    raise-version --help
    ```

3. Make changes to your source code, describe them in changelog file (if used) and raise a version:

    ```
    raise-version <release> [options]
    ```
