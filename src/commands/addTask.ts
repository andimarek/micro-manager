import { Command, CommandResult } from '../inputreader';
import { pull } from '../data-exchange';
import { getConfig, Config } from '../domain';
import { find } from 'lodash';
import { log } from '../log';

const nodeRequire = (path: string): void => {
  try {
    eval(`require('${path}');`);
  } catch (e) {
    log('exception ', e);
  }
};

const command: Command = {
  name: 'add-task',
  arguments: [
    { name: 'path' }
  ],
  execute(args: string[]) {
    return execute(args);
  }
};

function execute(args: string[]): Promise<CommandResult> {
  const path = args[0];
  log.debug('adding new task from ', path);
  nodeRequire(path);
  return Promise.resolve({ success: true });
}

export default command;