import { setCommands, Command, start as startReadingInput } from './inputreader';
import { init as initDomain, getRepos, Repository, getConfig } from './domain';
import { openServer } from './data-exchange';
import { log } from './log';
import * as program from 'commander';

import checkout from './commands/checkout';
import push from './commands/push';
import pull from './commands/pull';
import config from './commands/config';
import data from './commands/data';
import exit from './commands/exit';
import analyzeDeps from './commands/analyzeDeps';

process.on('uncaughtException', (exception) => {
  log.error(`uncaught exception ${exception} ... exiting now`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  log.error('unhandled promise rejection...exiting now', reason);
  process.exit(1);
});

log('starting micro-manager 😄');

program.version('0.0.1')
  .option('-e, --execute <command>', 'execute the command and exit')
  .parse(process.argv);


const commands: Command[] = [
  checkout,
  push,
  pull,
  config,
  data,
  exit,
  analyzeDeps
];
setCommands(commands);

initDomain()
  .then(openServer)
  .then(() => startReadingInput(program.execute));
