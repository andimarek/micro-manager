import { getData, getRepositoryById, Project, PROJECT_TYPE_GRADLE, GradleComplexType } from '../domain';
import { size, groupBy, identity, pickBy, uniqBy, mapValues, sortBy, reduce, map, filter, forEach } from 'lodash';
import { log, Printer } from '../log';
import { checkoutAllProjects } from '../checkout';
import { Artifact, getDependencies, Configuration } from '../gradle';
import { inspect, firstElement, addToArray, mapLimit } from '../util';
import { red, blue } from 'chalk';
import * as R from 'ramda';

export interface ProjectAndDependencies {
  project: Project;
  configurations: Configuration[]
}

export function checkForDifferentVersions(): Promise<{ success: boolean, output: string }> {
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
      log.debug(`dependencies of all projects:`, dependencies);
      return checkVersion(dependencies!);
    });
}

// type VersionsByArtifact = { [name: string]: { project: Project, version: string, artifactId: string, groupId: string }[] };
type VersionsByArtifact = { [name: string]: { project: Project, artifact: Artifact}[] };

export function checkVersion(dependencies: ProjectAndDependencies[]): { success: boolean, output?: string } {
  const relevantDependencies = getRuntimeDependencies(dependencies);

  const configurationsLens = R.lensProp('configurations');
  const projectLens = R.lensProp('project');
  const dependenciesLens = R.lensProp('dependencies');
  const artifactName = (artifact: Artifact) => artifact.groupId + ':' + artifact.artifactId;

  const flattenArtifacts = R.map(
    R.over(configurationsLens, R.chain(R.view(dependenciesLens)))
  )(relevantDependencies);

  const projectAndArtifact = R.chain(
    ({ project, configurations }) => R.map((artifact) => ({ project, artifact }))(configurations)
  )(flattenArtifacts);

  const groupedByArtifactName: VersionsByArtifact = R.groupBy(R.compose(artifactName, R.prop('artifact')))(projectAndArtifact)

  const uniqArtifacts: VersionsByArtifact = R.map(R.uniqBy(({ artifact }) => artifact.version))(groupedByArtifactName);
  const withDifferentVersions: VersionsByArtifact = R.filter(R.compose(R.gt(R.__, 1), R.length))(uniqArtifacts);

  if (size(withDifferentVersions) === 0) {
    return { success: true };
  }
  return { success: false, output: createInfoMessage(withDifferentVersions) };
}

export function createInfoMessage(artifactsWithMultipleVersions: VersionsByArtifact): string {
  const array = map(artifactsWithMultipleVersions, (infos, name) => {
    return {
      name,
      groupId: infos[0].artifact.groupId,
      artifactId: infos[0].artifact.artifactId,
      infos
    }
  });
  const sorted = sortBy(array, ({ groupId }) => groupId);
  const byGroupId = groupBy(array, ({ groupId }) => groupId);
  const printer = new Printer();
  printer.print(`found different versions used in different projects:`);
  forEach(byGroupId, (withSameGroupId, groupId) => {
    printer.print(groupId + ':');
    forEach(withSameGroupId, ({ name, infos, artifactId }) => {
      const versions = map(infos, (info) => info.artifact.version);
      const projects = map(infos, (info) => info.project.name);
      printer.print(`${artifactId} is used in different versions: `, versions, ' in these projects: ', projects);
    });
    printer.print();
  });
  return printer.value;
}

export function getRuntimeDependencies(dependencies: ProjectAndDependencies[]): { project: Project, configurations: Configuration[] }[] {
  const configurations = R.lensProp('configurations')
  const isRuntimeConfig = config => config.name === 'runtime' || config.name === 'runtimeOnly';
  return R.map(R.over(configurations, R.filter(isRuntimeConfig)))(dependencies);
}
