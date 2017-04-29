import { Repository, Config, getRepos, getConfig } from '../domain';
import { spawn } from 'child_process';
import { noop } from 'lodash';
import { gitClone } from '../git';
import { checkForDifferentVersions } from '../tasks/analyzeDependencies'

import { Command, CommandResult } from '../inputreader';

const command: Command = {
  name: 'analyzeDeps',
  arguments: [
  ],
  execute(args: string[]) {
    return analyze();
  }
};

export default command;

function analyze(): Promise<CommandResult> {
  return checkForDifferentVersions();
}
