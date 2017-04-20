import { Repository, Config } from './domain';
import { exec, execFile } from 'child_process';
import { log } from './log';
import { newTmpDir, executeCommand } from './util';

import {gitClone} from './git';

export function checkoutIntoTmp(repos: Repository[]): Promise<void> {
  const tmpDir = newTmpDir();
  const promises: Promise<string>[] = [];
  log(`tmpDir: ${tmpDir}`);
  for (const repo of repos) {
    log(`checking out ${repo.url}`);
    promises.push(gitClone(repo.url, tmpDir));
  }
  return Promise.all(promises).then(() => { 
    log.success('checked out all repos') 
  });
}

export function checkout(repos: Repository[], config: Config) {
  for (const repo of repos) {
    console.log(`checking out ${repo.url}`);
    gitClone(repo.url, config.rootPath!);
  }
}


