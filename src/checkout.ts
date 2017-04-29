import { getRepos, Repository, Config, Project, getRepositoryByIdSafe } from './domain';
import { exec, execFile } from 'child_process';
import { log } from './log';
import { newTmpDir, executeCommand, makePath, addToArray } from './util';
import { gitClone, gitCloneInWorkspace } from './git';
import { flatMap, keys, map, reduce, uniqBy, find, constant, forEach } from 'lodash';
import { mapLimit, ensureDirExists } from './util';

const maxParallel = 5;

function checkoutIntoTmp(repos: Repository[]): Promise<{ [repoId: string]: string }> {
  const promises: Promise<string>[] = [];
  const pathByRepoId: { [repoId: string]: string } = {};
  return mapLimit(repos, maxParallel, (repo) => {
    const tmpDir = newTmpDir();
    log.debug(`checking out ${repo.url} into ${tmpDir}`);
    pathByRepoId[repo.id] = tmpDir;
    return gitClone(repo.url, tmpDir);
  }).then(constant(pathByRepoId));
}

export function checkoutIntoWorkspace(workspace: string): Promise<{ success: boolean }> {
  const repos = getRepos();
  const promises: Promise<any>[] = [];
  return ensureDirExists(workspace).then(() => {
    log.debug(`checking out all ${repos.length} repos into: ${workspace}`);
    return mapLimit(repos, maxParallel, (repo) => {
      log.debug(`checking out ${repo.url}`);
      return gitCloneInWorkspace(repo.url, workspace);
    }).then(() => {
      return { success: true };
    });
  });

}

export type PathByProjectId = { [projectId: string]: { projectPath: string, repoPath: string } };

export function checkoutAllProjects(projects: Project[]): Promise<PathByProjectId> {
  const repoByProjectId: { [projectId: string]: Repository } = {}
  const projectsByRepoId: { [repoId: string]: Project[] } = {};
  const allReposWithDuplicates: Repository[] = [];

  for (const project of projects) {
    const repo = getRepositoryByIdSafe(project.repositoryId);
    repoByProjectId[project.id] = repo;

    addToArray(projectsByRepoId, repo.id, project);
    allReposWithDuplicates.push(repo);
  }
  const uniqueRepos = uniqBy(allReposWithDuplicates, (repo) => repo.id);
  log(`checking out ${uniqueRepos.length} repos`);
  return checkoutIntoTmp(uniqueRepos).then((pathByRepoId) => {
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



