import { find } from 'lodash';
import { log } from './log';
import * as fs from 'fs';

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

// let data = JSON.parse(fs.readFileSync('~/.mm/data.json', 'utf8'));
// const config: Config = JSON.parse(fs.readFileSync('~/config.json', 'utf-8'));

let data: Data;
let config: Config;

/**
 * 
 */

export function init(): Promise<void> {
  const dir = `${process.env.HOME}/.mm`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const dataPath = `${process.env.HOME}/.mm/data.json`;
  const dataPromise = readFile(dataPath, { repos: [] } as Data).then((content) => {
    data = <Data>content;
  });
  const configPath = `${process.env.HOME}/.mm/config.json`;
  const configPromise = readFile(configPath, { remotes: [] } as Config).then((content) => {
    config = <Config>content;
  });
  return Promise.all([dataPromise, configPromise]).then(() => { });
}

function readFile(path: string, defaultContent: object): Promise<object> {
  const result = new Promise<object>((resolve, reject) => {
    const fd = fs.access(path, fs.constants.R_OK | fs.constants.W_OK, (err) => {
      if (err && err.code === 'ENOENT') {
        console.log(`no file ${path}`);
        fs.writeFileSync(path, JSON.stringify(defaultContent));
        resolve(defaultContent);
      } else if (err){
        console.error(err);
        reject(err);
      }
      const content = JSON.parse(fs.readFileSync(path, 'utf8'));
      resolve(content);
    });
  });
  return result;

}
// const dataFile = (<any>fs.readFileSync)(fd, 'utf-8');
// const dataFile = fs.accessSync('~/.mm/data.json',fs.constants.O_RDWR | fs.constants.S_IFREG);

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