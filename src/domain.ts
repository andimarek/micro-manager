import { find } from 'lodash';
import { log } from './log';

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
  rootPath: string;
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

const fs = require('fs');
let data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const config: Config = JSON.parse(fs.readFileSync('./config.json'));

/**
 * 
 */

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
  if (!newRepos) {
    return null;
  }
  const result: Data = {
    repos: newRepos
  }
  return result;
}


function mergeRepos(repos1: Repository[], repos2: Repository[]): Repository[] | null {
  const result: Repository[] = repos1.slice();
  for (const repo of repos2) {
    const otherRepo = find(repos1, ['url', repo.url]);
    if (!otherRepo) {
      result.push(repo);
    } else {
      if (!areReposEqual(repo, otherRepo)) {
        log.error(`cant merge repos. different repos:`, repo, otherRepo);
        return null;
      }
    }
  }
  return result;
}

function areReposEqual(repo1: Repository, repo2: Repository): boolean {
  return repo1.url === repo2.url &&
    repo2.type === repo2.type;
}

export function getConfig(): Config {
  return config;
}