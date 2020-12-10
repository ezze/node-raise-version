declare interface ChangelogOptions {
  path: string;
  encoding: string;
  prefix: string;
  bullet: string;
}

declare interface ChangelogOptionsSoft {
  path?: string;
  encoding?: string;
  prefix?: string;
  bullet?: string;
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

declare interface GitOptionsSoft {
  release?: string;
  development?: string;
  remote?: string;
  commit?: boolean;
  merge?: boolean;
  all?: boolean;
  tag?: boolean;
  push?: boolean;
}

declare interface ChangelogConfig extends ChangelogOptions {
  enabled: boolean;
}

declare interface ChangelogConfigOptional extends ChangelogOptionsSoft {
  enabled?: boolean;
}

declare interface GitConfig extends GitOptions {
  enabled: boolean;
}

declare interface GitConfigOptional extends GitOptionsSoft {
  enabled?: boolean;
}

declare interface RaiseVersionConfig {
  skipUpdate?: boolean;
  release?: string;
  changelog: ChangelogConfig;
  git: GitConfig;
}

declare interface RaiseVersionConfigOptional {
  skipUpdate?: boolean;
  release?: string;
  changelog?: ChangelogConfigOptional;
  git?: GitConfigOptional;
}

declare interface ChangelogArgs {
  changelog: boolean;
  changelogPath: string;
  changelogEncoding: string;
  changelogPrefix: string;
  changelogBullet: string;
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

declare interface RaiseVersionArgs extends ChangelogArgs, GitArgs {
  skipUpdate?: boolean;
  release?: string;
}

declare interface UpdateGitRepositoryVersionOptions extends GitOptionsSoft {
  repoPath?: string;
  packageJsonPath?: string;
  changeLogPath?: string;
  verbose?: boolean;
}

declare interface GitCommandOptions {
  repoPath?: string;
  verbose?: boolean;
}
