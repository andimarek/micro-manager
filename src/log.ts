import { red, green, magenta } from 'chalk';

export interface Logger {
  (message, ...optional: any[]): void;
  error(message, ...optional: any[]): void;
  success(message, ...optional: any[]): void;
  debug(message, ...optional: any[]): void;
}
function defaultLog(message: string, ...optional: any[]) {
  console.log.apply(null, [message].concat(optional));
}

function logError(message: string, ...optional: any[]) {
  console.log.apply(null, [red(message)].concat(optional));
}

function logSuccess(message: string, ...optional: any[]) {
  console.log.apply(null, [green(message)].concat(optional));
}

function debug(message: string, ...optional: any[]) {
  console.log.apply(null, [magenta('[DEBUG] ')].concat(message).concat(optional));
}

const log: Logger = <Logger>defaultLog;
log.error = logError;
log.success = logSuccess;
log.debug = debug;

export { log };
