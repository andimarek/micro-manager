import { Command } from '../inputreader';
import { push } from '../data-exchange';
import { getConfig, Config } from '../domain';
import { find } from 'lodash';
import { log } from '../log';

const command: Command = {
  name: 'remote',
  arguments: [
    { name: '' }
  ],
  execute(args: string[]) {
    return Promise.resolve();
  }
};


export default command;