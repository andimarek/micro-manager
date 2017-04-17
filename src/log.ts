import { red, green } from 'chalk';

export interface Logger {
  (message, ...optional: any[]): void;
  error(message, ...optional: any[]): void;
  success(message, ...optional: any[]): void;
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
const log: Logger = <Logger>defaultLog;
log.error = logError;
log.success = logSuccess;

export { log };
