import { red, green, magenta } from 'chalk';
import { map } from 'lodash';
import { inspect } from 'util';

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

export class Printer {
  public value: string = '';

  print(message?: string, ...optional: any[]): void {
    if(!message) {
      this.value += '\n';
      return;
    }
    const optionalPrints = map(optional, (toPrint) => inspect(toPrint));
    this.value += message + optionalPrints.join() + '\n';
  }
}


const log: Logger = <Logger>defaultLog;
log.error = logError;
log.success = logSuccess;
log.debug = debug;

export { log };
