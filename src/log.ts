import { red, green, magenta } from 'chalk';
import { map } from 'lodash';
import { inspect } from 'util';
import * as winston from 'winston';
import { MicroManagerBaseDir } from './constants';

winston.configure({
  transports: [
    new winston.transports.File({
      filename: `${MicroManagerBaseDir}/micro-manager.log`,
      json: false,
      level: 'debug',
    }),
  ],
});

export interface Logger {
  (message, ...optional: any[]): void;
  error(message, ...optional: any[]): void;
  success(message, ...optional: any[]): void;
  debug(message, ...optional: any[]): void;
}

function defaultLog(message: string, ...optional: any[]) {
  console.log.apply(null, [message].concat(optional));
  winston.log('info', toString(message, ...optional));
}

function logError(message: string, ...optional: any[]) {
  console.log.apply(null, [red(message)].concat(optional));
  winston.log('error', toString(message, ...optional));
}

function logSuccess(message: string, ...optional: any[]) {
  console.log.apply(null, [green(message)].concat(optional));
  winston.log('info', toString(message, ...optional));
}

function debug(message: string, ...optional: any[]) {
  // console.log.apply(null, [magenta('[DEBUG] ')].concat(message).concat(optional));
  winston.log('debug', toString(message, ...optional));
}

function toString(message: string, ...optional: any[]): string {
  if (optional.length === 0) {
    return message;
  }
  const optionalParts = map(optional, toPrint =>
    inspect(toPrint, { depth: undefined })
  );
  const result = message + optionalParts.join();
  return result;
}

export class Printer {
  public value: string = '';

  print(message?: string, ...optional: any[]): void {
    if (!message) {
      this.value += '\n';
      return;
    }
    const optionalPrints = map(optional, toPrint =>
      inspect(toPrint, { depth: undefined })
    );
    this.value += message + optionalPrints.join() + '\n';
  }
}

const log: Logger = <Logger>defaultLog;
log.error = logError;
log.success = logSuccess;
log.debug = debug;

export { log };
