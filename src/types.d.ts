declare interface ChangelogOptions {
  path: string;
  encoding: string;
  prefix: string;
  bullet: string;
}

declare interface ChangelogConfig extends ChangelogOptions {
  enabled: boolean;
}

declare interface ChangelogArgs {
  changelog: boolean;
  changelogPath: string;
  changelogEncoding: string;
  changelogPrefix: string;
  changelogBullet: string;
}

declare interface GitOptions {
  release: string;
  development: string;
  remote: string;
  commit: boolean;
  merge: boolean;
  all: boolean;
  tag: boolean;
  push: boolean;
}

declare interface GitConfig extends GitOptions {
  enabled: boolean;
}

declare interface GitArgs {
  git: boolean;
  gitRelease: string;
  gitDevelopment: string;
  gitRemote: string;
  gitCommit: boolean;
  gitMerge: boolean;
  gitAll: boolean;
  gitTag: boolean;
  gitPush: boolean;
}

declare interface RaiseVersionConfig {
  changelog: ChangelogConfig;
  git: GitOptions;
}

declare interface RaiseVersionOptions extends ChangelogArgs, GitArgs {
  skipUpdate?: boolean;
  release?: string;
}
