import { Repository, Config, getRepos, getConfig } from '../domain';
import { spawn } from 'child_process';
import { noop } from 'lodash';
import { gitCloneInWorkspace } from '../git';
import { log } from '../log';
import { ensureDirExists, mapLimit } from '../util';
import { Command } from '../inputreader';
import {checkoutIntoWorkspace} from '../checkout';

const command: Command = {
  name: 'checkout',
  arguments: [
    { name: "dir" }
  ],
  execute(args: string[]): Promise<void> {
    return checkoutIntoWorkspace(args[0]);
  }
};

const maxParallel = 5;

export default command;

