import { Repository, Config, getRepos, getConfig } from '../domain';
import { spawn } from 'child_process';
import {noop} from 'lodash';
import {gitCloneInWorkspace} from '../git';
import {log} from '../log';
import {ensureDirExists} from '../util';

import {Command} from '../inputreader';
const command: Command = {
  name: 'checkout',
  arguments: [ 
    {name: "dir"}
  ],
  execute(args: string[]): Promise<void> {
    return checkout(args[0]);
  }
};

export default command;

async function checkout(targetDir:string): Promise<void> {
  const repos = getRepos(); 
  const config = getConfig();
  const promises: Promise<any>[] = [];
  await ensureDirExists(targetDir);
  log.debug(`checking out all repos into: ${targetDir}`);
  for (const repo of repos) {
    log.debug(`checking out ${repo.url}`);
    promises.push(gitCloneInWorkspace(repo.url, targetDir));
  }
  return Promise.all(promises).then(noop);
}
