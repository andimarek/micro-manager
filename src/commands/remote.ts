import { Command } from '../inputreader';
import { push } from '../data-exchange';
import { getConfig, Config, getDataDir } from '../domain';
import { find } from 'lodash';
import { log } from '../log';
import { setOrigin } from '../git';

const command: Command = {
  name: 'remote-set-origin',
  arguments: [
    { name: 'remote-url' }
  ],
  execute(args: string[]) {
    return setOrigin(getDataDir(), args[0]);
  }
};


export default command;