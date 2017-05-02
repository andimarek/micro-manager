import { Command } from '../inputreader';
import { push } from '../data-exchange';
import { getConfig, Config, getDataDir, refreshData } from '../domain';
import { find, constant } from 'lodash';
import { log } from '../log';
import { setOrigin, pullOrigin } from '../git';

const setOriginCommand: Command = {
  name: 'remote-set-origin',
  arguments: [
    { name: 'remote-url' }
  ],
  execute(args: string[]) {
    return setOrigin(getDataDir(), args[0]);
  }
};

const pullOriginCommand: Command = {
  name: 'remote-pull-origin',
  arguments: [
  ],
  execute(args: string[]) {
    return pullOrigin(getDataDir())
      .then(() => refreshData())
      .then(constant({ success: true }));
  }
};


export default [setOriginCommand, pullOriginCommand];