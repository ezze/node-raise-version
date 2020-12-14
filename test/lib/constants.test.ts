import {
  raiseVerRcName,
  defaultChangeLogConfig,
  defaultGitConfig,
  defaultRaiseVerConfig
} from '../../src/lib/constants';

describe('constants', () => {
  it('configuration file name', () => {
    expect(raiseVerRcName).toBe('.raiseverrc');
  });

  describe('defaults', () => {
    const expectedChangeLogConfig = {
      enabled: true,
      path: 'CHANGELOG.md',
      encoding: 'utf-8',
      prefix: '##',
      bullet: '-'
    };

    const expectedGitConfig = {
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

    it('default changelog config', () => {
      expect(defaultChangeLogConfig).toEqual(expectedChangeLogConfig);
    });

    it('default git config', () => {
      expect(defaultGitConfig).toEqual(expectedGitConfig);
    });

    it('default raise-version config', () => {
      expect(defaultRaiseVerConfig).toEqual({
        changelog: expectedChangeLogConfig,
        git: expectedGitConfig
      });
    });
  });
});
