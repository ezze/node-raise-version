const raiseVerRcName = '.raiseverrc';

const defaultChangeLogConfig = {
  enabled: true,
  path: 'CHANGELOG.md',
  encoding: 'utf-8',
  prefix: '##',
  bullet: '-'
};

const defaultGitConfig = {
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

const defaultRaiseVerConfig = {
  changelog: defaultChangeLogConfig,
  git: defaultGitConfig
};

const RELEASE_MAJOR = 'major';
const RELEASE_MINOR = 'minor';
const RELEASE_PATCH = 'patch';

const releases = [
  RELEASE_MAJOR,
  RELEASE_MINOR,
  RELEASE_PATCH
];

module.exports = {
  raiseVerRcName,
  defaultChangeLogConfig,
  defaultGitConfig,
  defaultRaiseVerConfig,
  RELEASE_MAJOR,
  RELEASE_MINOR,
  RELEASE_PATCH,
  releases
};
