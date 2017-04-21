import {Command} from '../inputreader';
import {getData, Data} from '../domain';
import {find} from 'lodash';
import {log } from '../log';

const command: Command = {
  name: 'data',
  arguments: [
  ],
  execute(args: string[]) {
    return run(args);
  }
};

function run(args: string[]) {
  const data = getData();
  log('current data:\n', data);
  return Promise.resolve();
}

export default command;