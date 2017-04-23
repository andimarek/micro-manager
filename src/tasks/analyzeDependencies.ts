import { getData, getRepositoryById, Project, PROJECT_TYPE_GRADLE } from '../domain';
import { filter } from 'lodash';
import { log } from '../log';
import { checkoutAllProjects } from '../checkout';
import { getDependencies, Configuration } from '../gradle';

export function findDifferentVersions(): Promise<any> {
  const projects = getData().projects;
  const gradleProjects = filter(projects, (project) => project.type === PROJECT_TYPE_GRADLE);
  log.debug(`found ${gradleProjects.length} gradle projects`);
  return checkoutAllProjects(gradleProjects)
    .then((pathByProjectId) => {
      return Promise.all(gradleProjects.map((project) => getDependencies(pathByProjectId[project.id])));
    })
    .then((dependencies) => {
      log(`dependencies of all projects:`, dependencies);
    });
}

function checkVersion(configuration: Configuration[][]) {

}