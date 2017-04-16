import {Command} from '../inputreader';
import {getConfig} from '../domain';
const command: Command = {
  name: 'config',
  arguments: [
  ],
  execute(args: string[]) {
    run(args);
  }
};

function run(args: string[]) {
  const config = getConfig();
  console.log('current config:', config);
}

export default command;