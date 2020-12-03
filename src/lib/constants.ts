export const raiseVerRcName = '.raiseverrc';

export const RELEASE_MAJOR = 'major';
export const RELEASE_MINOR = 'minor';
export const RELEASE_PATCH = 'patch';

export const releases: Array<string> = [
  RELEASE_MAJOR,
  RELEASE_MINOR,
  RELEASE_PATCH
];

export const defaultChangeLogConfig: ChangelogConfig = {
  enabled: true,
  path: 'CHANGELOG.md',
  encoding: 'utf-8',
  prefix: '##',
  bullet: '-'
};

export const defaultGitConfig: GitConfig = {
  enabled: true,
  release: 'master',
  development: 'develop',
  remote: 'origin',
  commit: true,
  merge: true,
  all: false,
  tag: true,
  push: false
};

export const defaultRaiseVerConfig: RaiseVersionConfig = {
  changelog: defaultChangeLogConfig,
  git: defaultGitConfig
};
