import { Repository, Config, Project, getRepositoryByIdSafe } from './domain';
import { exec, execFile } from 'child_process';
import { log } from './log';
import { newTmpDir, executeCommand, makePath, addToArray } from './util';
import { gitClone } from './git';
import { flatMap, keys, map, reduce, uniqBy, find, constant, forEach } from 'lodash';

export function checkoutIntoTmp(repos: Iterable<Repository>): Promise<{ [repoId: string]: string }> {
  const promises: Promise<string>[] = [];
  const pathByRepoId: { [repoId: string]: string } = {};
  for (const repo of repos) {
    const tmpDir = newTmpDir();
    log.debug(`checking out ${repo.url} into ${tmpDir}`);
    pathByRepoId[repo.id] = tmpDir;
    promises.push(gitClone(repo.url, tmpDir));
  }
  return Promise.all(promises).then(constant(pathByRepoId));
}

export type PathByProjectId = { [projectId: string]: { projectPath: string, repoPath: string } };

export function checkoutAllProjects(projects: Project[]): Promise<PathByProjectId> {
  const repoByProjectId: { [projectId: string]: Repository }[] = [];
  const projectsByRepoId: { [repoId: string]: Project[] } = {};
  const allRepos: Set<Repository> = new Set<Repository>();
  for (const project of projects) {
    const repo = getRepositoryByIdSafe(project.repositoryId);
    addToArray(projectsByRepoId, repo.id, project);
    repoByProjectId[project.id] = repo;
    allRepos.add(repo);
  }
  return checkoutIntoTmp(allRepos).then((pathByRepoId) => {
    log.debug(`checked out all repos`);
    type RepoPathProject = [string, Project];
    const repoIds = keys(pathByRepoId);
    const repoPathProjecTuples: RepoPathProject[] = flatMap(repoIds, (repoId): RepoPathProject[] => {
      const projects = projectsByRepoId[repoId];
      const repoPath = pathByRepoId[repoId];
      return map(projects, (project) => [repoPath, project] as RepoPathProject);
    });
    return reduce(repoPathProjecTuples, (acc, [path, project]) => {
      return {
        [project.id]: {
          repoPath: path,
          projectPath: makePath(path, project.path)
        },
        ...acc
      };
    }, {} as PathByProjectId);
  });
}



