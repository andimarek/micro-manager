import { isUndefined, includes, pickBy, size, forEach, find, uniqBy, reduce, groupBy, filter } from 'lodash';
import { log } from './log';
import * as fs from 'fs';
import { ensureDirExists, readFile, writeFile, sleep } from './util';
import { assertDefined, assertTrue } from './assert';
import { ensureGitRepo, ensureFileIsCommited } from './git';
import { MicroManagerBaseDir } from './constants';

export interface Repository {
  id: string;
  type: string;
  url: string;
}

export const REPOSITORY_TYPE_GIT = 'git';
const REPO_TYPES = [REPOSITORY_TYPE_GIT];

export interface Project {
  id: string;
  name: string;
  repositoryId: string;
  path: string;
  type: ProjectType;
}

export const PROJECT_TYPE_GRADLE = 'gradle';
// export const PROJECT_TYPE_MAVEN = 'maven';
const PROJECT_TYPES = [PROJECT_TYPE_GRADLE];

export interface GradleComplexType {
  name: 'gradle';
  'gradlew-path': string
};
export type ProjectType = string | GradleComplexType;

export interface Product {
  name: string;
  projects: Project[];
}

export interface Config {
  rootPath?: string;
  remotes: RemoteManager[];
}

export interface RemoteManager {
  name: string;
  url: string;
}

export interface Data {
  repos: Repository[];
  projects: Project[];
}


/**
 * 
 * 
 */


const dataDir = `${MicroManagerBaseDir}/data`;
const dataFileName = 'data.json';
const dataFileFullPath = `${dataDir}/${dataFileName}`;
let data: Data;
let config: Config;

/**
 * 
 */

export function getDataDir() {
  return dataDir;
}

export async function refreshData() {
  data = <Data>await readFile(dataFileFullPath, { repos: [], projects: [] } as Data);
  log.debug('refreshed data:', data);
}

export async function init(): Promise<any> {

  await ensureDirExists(MicroManagerBaseDir);
  await ensureDirExists(dataDir)

  data = <Data>await readFile(dataFileFullPath, { repos: [], projects: [] } as Data);
  log.debug('data:', data);
  validateData();
  await ensureGitRepo(dataDir);
  await ensureFileIsCommited(dataDir, dataFileName);

  const configPath = `${MicroManagerBaseDir}/config.json`;
  config = <Config>await readFile(configPath, { remotes: [] } as Config);
}

function validateData() {
  validateRepos();
  validateProjects();
  validateRepoReferences();
}

function validateRepoReferences() {
  const invalidReferences = filter(data.projects, (project) => getRepositoryById(project.repositoryId) === undefined);
  if (invalidReferences.length > 0) {
    log.error(`invalid projects: the repositoryId is not valid for the following projects`);
    log.error(`invalid projects:`, invalidReferences);
    throw new Error('invalid data');
  }
}

function validateProjects() {
  checkForDuplicateProjectIds();
  checkForDuplicateProjectNames();
  validProjectTypes();
}

function validateRepos() {
  checkForDuplicateRepoIds();
  checkForDuplicateRepoUrls();
  validateRepoTypes();
}

function validProjectTypes() {
  const invalidProjects = filter(data.projects, (project) => {
    if (includes(PROJECT_TYPES, project.type)) {
      return false;
    }
    const complexType = <GradleComplexType>project.type;
    if (complexType.name !== PROJECT_TYPE_GRADLE) {
      return true;
    }
    if (isUndefined(complexType['gradlew-path'])) {
      return true;
    }
  });
  if (invalidProjects.length > 0) {
    log.error(`invalid project types:`, invalidProjects);
    throw new Error('invalid projects');
  }

}

function validateRepoTypes() {
  const invalidRepos = filter(data.repos, (repo) => !includes(REPO_TYPES, repo.type));
  if (invalidRepos.length > 0) {
    log.error(`invalid repo types:`, invalidRepos);
    log.error(`allowed repo types:`, REPO_TYPES);
    throw new Error('invalid repos');
  }
}

function getDuplicates<T>(data: T[], propName: string): { [key: string]: T[] } {
  type ById = { [key: string]: T[] };
  const byId = <ById>groupBy(data, propName);
  const duplicates = <ById>pickBy(byId, (elements) => elements.length > 1);
  return duplicates;
}

function checkForDuplicateRepoUrls() {
  const duplicates = getDuplicates(data.repos, 'url');
  if (size(duplicates) > 0) {
    log.error(`invalid repos: duplicate urls`);
    forEach(duplicates, (repos, url) => {
      log.error(`repos with the same url '${url}':`, repos);
    });
    log.error(`abort ... please fix that`);
    throw new Error('invalid data');
  }
}
function checkForDuplicateRepoIds() {
  const duplicates = getDuplicates(data.repos, 'id');
  if (size(duplicates) > 0) {
    log.error(`invalid repos: duplicate ids`);
    forEach(duplicates, (repos, id) => {
      log.error(`repos with the same id '${id}':`, repos);
    });
    log.error(`abort ... please fix that`);
    throw new Error('invalid data');
  }
}

function checkForDuplicateProjectNames() {
  const duplicates = getDuplicates(data.projects, 'name');
  if (size(duplicates) > 0) {
    log.error(`invalid projects: duplicate names`);
    forEach(duplicates, (projects, name) => {
      log.error(`projects with the same name '${name}':`, projects);
    });
    log.error(`abort ... please fix that`);
    throw new Error('invalid data');
  }
}

function checkForDuplicateProjectIds() {
  const duplicates = getDuplicates(data.projects, 'id');
  if (size(duplicates) > 0) {
    log.error(`invalid projects: duplicate ids`);
    forEach(duplicates, (projects, id) => {
      log.error(`projects with the same ids '${id}':`, projects);
    });
    log.error(`abort ... please fix that`);
    throw new Error('invalid data');
  }
}


function checkForUniqueIds(array: { id: string }[]): boolean {
  return uniqBy(array, 'id').length !== array.length;
}


export function getRepos(): Repository[] {
  return data.repos;
}

export function getRepositoryById(id: string): Repository | undefined {
  return find(data.repos, (repo) => repo.id === id);
}

export function getRepositoryByProjectName(projectName: string): Repository | undefined {
  const project = find(data.projects, (project) => project.name === projectName);
  if (!project) {
    return undefined;
  }
  const repo = getRepositoryById(project.repositoryId);
  return repo;
}

export function getRepositoryByIdSafe(id: string): Repository {
  const result = getRepositoryById(id);
  assertDefined(result, `repository with id ${id} not found`);
  return result!;
}
export function setData(_data: Data): Promise<void> {
  log.debug(`setting new data`, data);
  data = _data;
  return writeFile(dataFileFullPath, data)
    .then(() => ensureFileIsCommited(dataDir, dataFileName));
}
export function getData(): Data {
  return data;
}

export function mergeData(otherData: Data): Data | null {
  const newRepos = mergeRepos(otherData.repos, data.repos);
  const newProjects = mergeProjects(otherData.projects, data.projects);
  const result: Data = {
    repos: newRepos,
    projects: newProjects
  }
  return result;
}


function mergeRepos(repos1: Repository[], repos2: Repository[]): Repository[] {
  const result: Repository[] = repos1.slice();
  for (const repo of repos2) {
    const otherRepo = find(repos1, ['id', repo.id]);
    if (!otherRepo) {
      result.push(repo);
    } else {
      if (!areReposEqual(repo, otherRepo)) {
        log.error(`cant merge repos. different repos:`, repo, otherRepo);
        throw new Error(`can't merge repos. different repos with id ${repo.id}`);
      }
    }
  }
  return result;
}

function areReposEqual(repo1: Repository, repo2: Repository): boolean {
  return repo1.id === repo2.id &&
    repo1.url === repo2.url &&
    repo2.type === repo2.type;
}

function mergeProjects(projects1: Project[], projects2: Project[]): Project[] {
  const result: Project[] = projects1.slice();
  for (const proj of projects2) {
    const otherProj = find(projects1, ['id', proj.id]);
    if (!otherProj) {
      result.push(proj);
    } else {
      if (!areProjectsEqual(proj, otherProj)) {
        log.error(`cant merge projects. different projects:`, proj, otherProj);
        throw new Error(`can't merge projects. different projects with id ${proj.id}`);
      }
    }
  }
  return result;
}

function areProjectsEqual(proj1: Project, proj2: Project): boolean {
  return proj1.id === proj2.id &&
    proj1.name === proj2.name &&
    proj1.path === proj2.path &&
    proj1.type === proj2.type;
}

export function getConfig(): Config {
  return config;
}