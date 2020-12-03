const raiseVerRcName = '.raiseverrc';

const RELEASE_MAJOR = 'major';
const RELEASE_MINOR = 'minor';
const RELEASE_PATCH = 'patch';

const releases: Array<string> = [
  RELEASE_MAJOR,
  RELEASE_MINOR,
  RELEASE_PATCH
];

const defaultChangeLogConfig: ChangelogConfig = {
  enabled: true,
  path: 'CHANGELOG.md',
  encoding: 'utf-8',
  prefix: '##',
  bullet: '-'
};

const defaultGitConfig: GitConfig = {
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

const defaultRaiseVerConfig: RaiseVersionConfig = {
  changelog: defaultChangeLogConfig,
  git: defaultGitConfig
};

export {
  raiseVerRcName,
  defaultChangeLogConfig,
  defaultGitConfig,
  defaultRaiseVerConfig,
  RELEASE_MAJOR,
  RELEASE_MINOR,
  RELEASE_PATCH,
  releases
};
