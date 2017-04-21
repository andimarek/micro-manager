import {Command} from '../inputreader';
import {getConfig, Config} from '../domain';
import {find} from 'lodash';
import {log } from '../log';

const command: Command = {
  name: 'config',
  arguments: [
  ],
  execute(args: string[]) {
    return run(args);
  }
};

function run(args: string[]): Promise<void> {
  const config = getConfig();
  log('current config:\n', config);
  return Promise.resolve();
}

export default command;