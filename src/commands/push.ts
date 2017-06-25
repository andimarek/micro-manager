import { Command } from '../inputreader';
import { push } from '../data-exchange';
import { getConfig, Config } from '../domain';
import { find } from 'lodash';
import { log } from '../log';

const command: Command = {
  name: 'push',
  arguments: [{ name: 'remoteName' }],
  execute(args: string[]) {
    return executePush(args);
  }
};

function executePush(args: string[]): Promise<any> {
  const remoteName = args[0];
  const config = getConfig();
  log.debug(`executing push with remote ${remoteName}`);
  const remoteManager = find(
    config.remotes,
    remote => remote.name === remoteName
  );
  if (!remoteManager) {
    log.error(`invalid remote manager: ${remoteName}`);
    return Promise.reject(`invalid remote manager: ${remoteName}`);
  } else {
    return push(remoteManager.url);
  }
}

export default command;
