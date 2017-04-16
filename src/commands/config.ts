import {Command} from '../inputreader';
import {getConfig, Config} from '../domain';
import {find} from 'lodash';
import {log, error} from '../log';

const command: Command = {
  name: 'config',
  arguments: [
  ],
  execute(args: string[]) {
    run(args);
  }
};

function run(args: string[]) {
  const config = getConfig();
  console.log('current config:\n', config);
}

export default command;