import { expect } from 'chai';
import { Project, Repository } from '../src/domain';
import { createInfoMessage, getRuntimeDependencies, ProjectAndDependencies, checkVersion } from '../src/tasks/analyzeDependencies';
import { Configuration, Dependency } from '../src/gradle';

const repo: Repository = {
  id: '1',
  type: 'git',
  url: 'example.com'
}

const project: Project = {
  id: '1',
  name: 'project1',
  path: '',
  repositoryId: '1',
  type: 'gradle'
};

const project2: Project = {
  id: '2',
  name: 'project2',
  path: '',
  repositoryId: '1',
  type: 'gradle'
};

describe('analyze dependencies', () => {
  const runtimeConfig = {
    dependencies: [{
      groupId: 'groupId',
      artifactId: 'artifactId',
      version: '1.0',
    }],
    desc: '',
    name: 'runtime'
  };
  const runtimeConfig2 = {
    dependencies: [{
      groupId: 'groupId',
      artifactId: 'artifactId',
      version: '2.0',
    }],
    desc: '',
    name: 'runtime'
  }
  const buildConfig = {
    dependencies: [{
      groupId: 'groupId',
      artifactId: 'artifactId',
      version: '1.0',
    }],
    desc: '',
    name: 'build'
  };
  const projectAndDep: ProjectAndDependencies = {
    project,
    configurations: [runtimeConfig, buildConfig]
  };

  const projectAndDep2: ProjectAndDependencies = {
    project: project2,
    configurations: [runtimeConfig2]
  }

  it('checkversion returns error', () => {
    const message = "found different versions used in different projects:\ngroupId:\nartifactId is used in different versions: [ '1.0', '2.0' ],' in these projects: ',[ 'project1', 'project2' ]\n\n";
    const expectedResult = { success: false, output: message };
    const result = checkVersion([projectAndDep, projectAndDep2]);
    expect(result).to.deep.equal(expectedResult);
  });


  it('checkVersion returns no errors', () => {
    const expectedResult = { success: true };
    const result = checkVersion([projectAndDep]);
    expect(result).to.deep.equal(expectedResult);
  });

  it('getRuntimeDependencies', () => {

    const expectedResult = [{ project, configurations: [runtimeConfig] }]
    const result = getRuntimeDependencies([projectAndDep]);
    expect(result).to.deep.equal(expectedResult);
  });
});