import { expect } from 'chai';
import { Project, Repository } from '../src/domain';
import { getRuntimeDependencies, ProjectAndDependencies } from '../src/tasks/analyzeDependencies';
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

describe('analyze dependencies', () => {
  it('getRuntimeDependencies', () => {

    const runtimeConfig = {
      dependencies: [{
        groupId: 'groupId',
        artifactId: 'artifactId',
        version: '1.0',
      }],
      desc: '',
      name: 'runtime'
    };
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
    const expectedResult = [{ project, configurations: [runtimeConfig] }]
    const result = getRuntimeDependencies([projectAndDep]);
    expect(result).to.deep.equal(expectedResult);
  });
});