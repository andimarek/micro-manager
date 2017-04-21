import { find, uniqBy } from 'lodash';
import { log } from './log';
import * as fs from 'fs';
import { ensureDirExists, readFile, sleep } from './util';
import { assertDefined, assertTrue } from './assert';
import {ensureGitRepo, ensureFileIsCommited} from './git';

export interface Repository {
  id: string;
  type: RepositoryType;
  url: string;
}

export enum RepositoryType {
  Git,
  Svn
}

export interface Project {
  id: string;
  name: string;
  repositoryId: string;
  path: string;
  type: ProjectType;
}

export enum ProjectType {
  JavaMaven,
  JavaGradle,
  JavaScriptNpm
}

// export enum ProgrammingLanguage {
//   Java,
//   JavaScript
// }

export interface Product {
  name: string;
  projects: Project[];
}

export interface Task {

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
}


/**
 * 
 * 
 */


let data: Data;
let config: Config;

/**
 * 
 */

export async function init(): Promise<any> {
  const baseDir = `${process.env.HOME}/.micro-manager`;
  const dataDir = `${baseDir}/data`;
  const dataFile = `${dataDir}/data.json`;

  await ensureDirExists(baseDir);
  await ensureDirExists(dataDir)

  data = <Data>await readFile(dataFile, { repos: [] } as Data);

  await ensureGitRepo(dataDir);
  await ensureFileIsCommited(dataDir, 'data.json');

  const configPath = `${baseDir}/config.json`;
  config = <Config>await readFile(configPath, { remotes: [] } as Config);
}

function validateData() {
  for (const repo of data.repos) {
    assertDefined(repo.id, `repo is invalid. id is missing ${repo}`)
    assertDefined(repo.url, `repo is invalid. url is missing ${repo}`)
    assertDefined(repo.type, `repo is invalid. type is missing ${repo}`)
  }
  assertTrue(checkForUniqueIds(data.repos));
}

function checkForUniqueIds(array: { id: string }[]): boolean {
  return uniqBy(array, 'id').length !== array.length;
}


export function getRepos(): Repository[] {
  return data.repos;
}
export function setData(_data: Data) {
  log(`setting new data`, data);
  data = _data;
}
export function getData(): Data {
  return data;
}

export function mergeData(otherData: Data): Data | null {
  const newRepos = mergeRepos(otherData.repos, data.repos);
  const result: Data = {
    repos: newRepos
  }
  return result;
}


function mergeRepos(repos1: Repository[], repos2: Repository[]): Repository[]{
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