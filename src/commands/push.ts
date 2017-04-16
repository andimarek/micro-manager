import {Command} from '../inputreader';
const command: Command = {
  name: 'push',
  arguments: [
    {name: 'remoteName'}
  ],
  execute(args: string[]) {
    executePush(args);
  }
};

function executePush(args: string[]) {
  const remoteName = args[0];
  console.log(`executing push with remote ${remoteName}`);
}

export default command;