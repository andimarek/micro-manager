import { getData, getRepositoryById, Project, PROJECT_TYPE_GRADLE, GradleComplexType } from '../domain';
import { filter, forEach } from 'lodash';
import { log } from '../log';
import { checkoutAllProjects } from '../checkout';
import { getDependencies, Configuration } from '../gradle';
import { addToArray } from '../util';

export function findDifferentVersions(): Promise<any> {
  const projects = getData().projects;
  const gradleProjects = filter<Project>(projects, (project) => {
    return project.type === PROJECT_TYPE_GRADLE || (<GradleComplexType>project.type).name === PROJECT_TYPE_GRADLE;
  });
  log.debug(`found ${gradleProjects.length} gradle projects`);
  return checkoutAllProjects(gradleProjects)
    .then((pathByProjectId) => {
      return Promise.all(gradleProjects.map((project) => getDependencies(pathByProjectId[project.id].projectPath, pathByProjectId[project.id].repoPath, project)));
    })
    .then((dependencies) => {
      log(`dependencies of all projects:`, dependencies);
      checkVersion(dependencies);
    });
}

function checkVersion(configurations: Configuration[][]) {
  const relevantConfigs = getRuntimeDependencies(configurations);
  const versionByArtifact: { [name: string]: Set<string> } = {};
  for (const config of relevantConfigs) {
    for (const dependency of config.dependencies) {
      const depName = dependency.groupId + ':' + dependency.artifactId;
      if (!versionByArtifact[depName]) {
        versionByArtifact[depName] = new Set<string>();
      }
      versionByArtifact[depName].add(dependency.version);
    }
  }
  forEach(versionByArtifact, (versions, name) => {
    if (versions.size === 1) {
      return;
    }
    log(`${name} is used in different versions: `, versions);
  });
}

function getRuntimeDependencies(configurations: Configuration[][]): Configuration[] {
  const result: Configuration[] = [];
  for (const configArray of configurations) {
    for (const config of configArray) {
      if (config.name === 'runtime' || config.name === 'runtimeOnly') {
        result.push(config);
      }
    }
  }
  return result;
}
