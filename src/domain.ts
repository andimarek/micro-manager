
export interface Repository {
  type: RepositoryType;
  url: string;
}

export enum RepositoryType {
  Git,
  Svn
}

export interface Project {
  repository: Repository;
  path: string;
  language: ProgrammingLanguage;
}

export enum ProgrammingLanguage {
  Java,
  JavaScript
}

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

interface Data {
  repos: Repository[];
}


/**
 * 
 * 
 */

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const config: Config = JSON.parse(fs.readFileSync('./config.json'));

/**
 * 
 */

export function getRepos(): Repository[] {
  return data.repos;
}

export function getConfig(): Config {
  return config;
}