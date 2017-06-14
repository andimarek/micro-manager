import { expect } from 'chai';
import { Project, Repository } from '../src/domain';
import { createInfoMessage, getRuntimeDependencies, ProjectAndDependencies, checkVersion } from '../src/extension/analyzeDependencies';
import { Configuration, Artifact } from '../src/gradle';

const repo: Repository = {
  id: '1',
  type: 'git',
  url: 'example.com'
}

const project1: Project = {
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
  const project1Info: ProjectAndDependencies = {
    project: project1,
    configurations: [{
      desc: '',
      name: 'runtime',
      dependencies: [{
        groupId: 'groupId',
        artifactId: 'artifactId',
        version: '1.0',
      },{
        groupId: 'com.example',
        artifactId: 'other',
        version: '3.0',
      }
      ]
    }, {
      desc: '',
      name: 'build',
      dependencies: [{
        groupId: 'groupId',
        artifactId: 'artifactId',
        version: '1.0',
      }],
    },
    {
      desc: '',
      name: 'runtimeOnly',
      dependencies: [{
        groupId: 'com.example',
        artifactId: 'other',
        version: '3.0',
      }]
    }]
  };

  const project2Info: ProjectAndDependencies = {
    project: project2,
    configurations: [{
      desc: '',
      name: 'runtime',
      dependencies: [{
        groupId: 'groupId',
        artifactId: 'artifactId',
        version: '2.0',
      }, {
        groupId: 'otherGroupId',
        artifactId: 'otherArtifact',
        version: '0.4.0',
      }],
    }]
  }

  it('checkversion returns error', () => {
    const message = "found different versions used in different projects:\ngroupId:\nartifactId is used in different versions: [ '1.0', '2.0' ],' in these projects: ',[ 'project1', 'project2' ]\n\n";
    const expectedResult = { success: false, output: message };
    const result = checkVersion([project1Info, project2Info]);
    expect(result).to.deep.equal(expectedResult);
  });


  it('checkVersion returns no errors', () => {
    const expectedResult = { success: true };
    const result = checkVersion([project1Info]);
    expect(result).to.deep.equal(expectedResult);
  });

  it('getRuntimeDependencies', () => {
    const expectedResult = [{ project: project1, configurations: [project1Info.configurations[0], project1Info.configurations[2]] }]
    const result = getRuntimeDependencies([project1Info]);
    expect(result).to.deep.equal(expectedResult);
  });
});