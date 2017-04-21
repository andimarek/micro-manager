import { Command } from '../inputreader';
import { pull } from '../data-exchange';
import { getConfig, Config } from '../domain';
import { find } from 'lodash';
import { log } from '../log';

const command: Command = {
  name: 'pull',
  arguments: [
    { name: 'remoteName' }
  ],
  execute(args: string[]) {
    return execute(args);
  }
};

function execute(args: string[]) {
  const remoteName = args[0];
  const config = getConfig();
  log(`executing pull with remote ${remoteName}`);
  const remoteManager = find(config.remotes, (remote) => remote.name === remoteName);
  if (!remoteManager) {
    log.error(`invalid remote manager: ${remoteName}`);
    return Promise.reject(`invalid remote manager: ${remoteName}`);
  } else {
    return pull(remoteManager.url);
  }
}

export default command;