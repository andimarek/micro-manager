import { Repository, Config, getRepos, getConfig } from '../domain';
import { spawn } from 'child_process';
import {noop} from 'lodash';
import {gitClone} from '../git';
import {findDifferentVersions} from '../tasks/analyzeDependencies'

import {Command} from '../inputreader';
const command: Command = {
  name: 'analyzeDeps',
  arguments: [
  ],
  execute(args: string[]): Promise<void> {
    return analyze();
  }
};

export default command;

function analyze(): Promise<void> {
  return findDifferentVersions();
}
