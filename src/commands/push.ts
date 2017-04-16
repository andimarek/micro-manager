import { Command } from '../inputreader';
import { push } from '../data-exchange';
import { getConfig, Config } from '../domain';
import { find } from 'lodash';
import { log, error } from '../log';

const command: Command = {
  name: 'push',
  arguments: [
    { name: 'remoteName' }
  ],
  execute(args: string[]) {
    executePush(args);
  }
};

function executePush(args: string[]) {
  const remoteName = args[0];
  const config = getConfig();
  console.log(`executing push with remote ${remoteName}`);
  const remoteManager = find(config.remotes, (remote) => remote.name === remoteName);
  if (!remoteManager) {
    error(`invalid remote manager: ${remoteName}`);
  } else {
    push(remoteManager.url);
  }
}

export default command;