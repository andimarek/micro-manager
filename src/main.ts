import { setCommands, Command } from './inputreader';
import { init, getRepos, Repository, getConfig } from './domain';
import { openServer } from './data-exchange';
import { log } from './log';

import checkout from './commands/checkout';
import push from './commands/push';
import pull from './commands/pull';
import config from './commands/config';

import {checkoutIntoTmp} from './checkout';

process.on('uncaughtException', (exception) => {
  log.error(`uncaught exception ${exception} ... exiting now`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  log.error('unhandled promise rejection...exiting now', reason);
  process.exit(1);
});

log('starting mm');

const commands: Command[] = [
  checkout,
  push,
  pull,
  config
];
setCommands(commands);

init().then( () => {
  openServer();
});



// checkoutIntoTmp(getRepos());