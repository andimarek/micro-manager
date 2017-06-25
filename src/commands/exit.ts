import { Command, stop } from '../inputreader';
import { getData, Data } from '../domain';
import { find, constant } from 'lodash';
import { log } from '../log';

const command: Command = {
  name: 'exit',
  arguments: [],
  execute(args: string[]) {
    return run(args);
  },
};

function run(args: string[]) {
  return stop({ exitCode: 0, silent: false }).then(constant({ success: true }));
}

export default command;
