import { getData, getRepositoryById, Project, PROJECT_TYPE_GRADLE, GradleComplexType } from '../domain';
import { groupBy, identity, pickBy, uniqBy, mapValues, sortBy, reduce, map, filter, forEach } from 'lodash';
import { log } from '../log';
import { checkoutAllProjects } from '../checkout';
import { getDependencies, Configuration } from '../gradle';
import { firstElement, addToArray, mapLimit } from '../util';
import {red, blue} from 'chalk';

interface ProjectAndDependencies {
  project: Project;
  configurations: Configuration[]
}
export function findDifferentVersions(): Promise<any> {
  const projects = getData().projects;
  const gradleProjects = filter<Project>(projects, (project) => {
    return project.type === PROJECT_TYPE_GRADLE || (<GradleComplexType>project.type).name === PROJECT_TYPE_GRADLE;
  });
  log.debug(`found ${gradleProjects.length} gradle projects`);
  return checkoutAllProjects(gradleProjects)
    .then((pathByProjectId) => {
      return mapLimit(gradleProjects, 5, (project) => {
        return getDependencies(pathByProjectId[project.id].projectPath, pathByProjectId[project.id].repoPath, project)
          .then((configurations) => {
            return {
              project,
              configurations
            };
          });
      });
    })
    .then((dependencies) => {
      log(`dependencies of all projects:`, dependencies);
      checkVersion(dependencies!);
    });
}

function checkVersion(dependencies: ProjectAndDependencies[]) {
  const relevantDependencies = getRuntimeDependencies(dependencies);
  type VersionsByArtifact = { [name: string]: { project: Project, version: string, artifactId: string, groupId: string }[] };
  const versionByArtifact: VersionsByArtifact = reduce(relevantDependencies, (acc, dependency) => {
    forEach(dependency.configurations, (config) => {
      forEach(config.dependencies, (artifact) => {
        const artifactName = artifact.groupId + ':' + artifact.artifactId;
        acc[artifactName] = (acc[artifactName] || []);
        acc[artifactName].push({ project: dependency.project, artifactId: artifact.artifactId, version: artifact.version, groupId: artifact.groupId });
      });
    });
    return acc;
  }, {} as VersionsByArtifact);

  const removedDuplicted = mapValues(versionByArtifact, (infos, artifactName) => {
    return uniqBy(infos, (info) => info.version);
  });

  const artifactsWithMultipleVersions = <VersionsByArtifact>pickBy(removedDuplicted, (infos) => infos.length > 1); 
  const array = map(artifactsWithMultipleVersions, (infos, name) => {
    return {
      name,
      groupId: infos[0].groupId,
      artifactId: infos[0].artifactId,
      infos
    }
  });

  const sorted = sortBy(array, ({groupId}) => groupId);
  const byGroupId = groupBy(array, ({groupId}) => groupId);
  forEach(byGroupId, (withSameGroupId, groupId) => {
    log(red(groupId + ':'));
    forEach(withSameGroupId, ({name, infos, artifactId}) => {
      const versions = map(infos, (info) => info.version);
      const projects = map(infos, (info) => info.project.name);
      log(`${artifactId} is used in different versions: `, versions, ' in these projects: ', projects);
    });
    log(``);
  });
}

function getRuntimeDependencies(dependencies: ProjectAndDependencies[]): { project: Project, configurations: Configuration[] }[] {
  const result: Configuration[] = [];
  return map(dependencies, ({ project, configurations }) => {
    return {
      project,
      configurations: filter(configurations, (config) => config.name === 'runtime' || config.name === 'runtimeOnly')
    };
  });
}
