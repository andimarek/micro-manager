import { Command, CommandResult } from '../inputreader';
import { pull } from '../data-exchange';
import { getConfig, Config } from '../domain';
import { find } from 'lodash';
import { log } from '../log';
import { loadExtensionFile } from '../extension/extensionHostManager';


const command: Command = {
  name: 'load-extension',
  arguments: [
    { name: 'path' }
  ],
  execute(args: string[]) {
    return execute(args);
  }
};

function execute(args: string[]): Promise<CommandResult> {
  const path = args[0];
  loadExtensionFile(path);
  return Promise.resolve({success: true});
}

export default command;