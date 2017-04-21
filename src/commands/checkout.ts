import { Repository, Config, getRepos, getConfig } from '../domain';
import { spawn } from 'child_process';
import {noop} from 'lodash';
import {gitClone} from '../git';

import {Command} from '../inputreader';
const command: Command = {
  name: 'checkout',
  arguments: [
  ],
  execute(args: string[]): Promise<void> {
    return checkout();
  }
};

export default command;

function checkout(): Promise<void> {
  const repos = getRepos(); 
  const config = getConfig();
  const promises: Promise<any>[] = [];
  for (const repo of repos) {
    console.log(`checking out ${repo.url}`);
    promises.push(gitClone(repo.url, config.rootPath!));
  }
  return Promise.all(promises).then(noop);
}
