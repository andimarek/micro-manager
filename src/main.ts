import { setCommands, Command } from './inputreader';
import { getRepos, Repository, getConfig } from './domain';
// import { checkout } from './checkout';
import { openServer } from './data-exchange';
import { log } from './log';

import checkout from './commands/checkout';
import push from './commands/push';
import config from './commands/config';

process.on('uncaughtException', (exception) => {
  log.error(`uncaught exception ${exception} ... exiting now`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  log.error('unhandled promise rejection...exiting now', reason);
  process.exit(1);
});

// function showRepos(repos: Repository[]) {
//   console.log('repos:');
//   for (const repo of repos) {
//     console.log(repo);
//   }
// }

log('starting mm');
openServer();

const commands: Command[] = [
  checkout,
  push,
  config
];

setCommands(commands);

