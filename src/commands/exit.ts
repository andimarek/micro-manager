import {Command} from '../inputreader';
import {getData, Data} from '../domain';
import {find} from 'lodash';
import {log } from '../log';

const command: Command = {
  name: 'exit',
  arguments: [
  ],
  execute(args: string[]) {
    run(args);
  }
};

function run(args: string[]) {
  log('👋  Goodbye');
  process.exit(0);
}

export default command;