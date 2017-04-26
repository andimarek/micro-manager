import { Repository, Config, getRepos, getConfig } from '../domain';
import { spawn } from 'child_process';
import { noop } from 'lodash';
import { gitCloneInWorkspace } from '../git';
import { log } from '../log';
import { ensureDirExists } from '../util';
import { Command } from '../inputreader';
import { mapLimit } from 'async';

const command: Command = {
  name: 'checkout',
  arguments: [
    { name: "dir" }
  ],
  execute(args: string[]): Promise<void> {
    return checkout(args[0]);
  }
};

const maxParallel = 5;

export default command;

function checkout(targetDir: string): Promise<void> {
  const repos = getRepos();
  const config = getConfig();
  const promises: Promise<any>[] = [];
  return ensureDirExists(targetDir).then(() => {
    log.debug(`checking out all repos into: ${targetDir}`);
    return new Promise<void>((resolve, reject) => {
      mapLimit(repos, 5, async (repo, callback) => {
        log.debug(`checking out ${repo.url}`);
        try {
          await gitCloneInWorkspace(repo.url, targetDir);
          callback();
        } catch (error) {
          callback(error);
        }
      }, (error) => {
        if (error) {
          reject(error);
        } else {
          log.success(`checkout finished`);
          resolve();
        }
      });
    });
  });
}
