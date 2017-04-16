import {red} from 'chalk';
export function log(message: string) {
  console.log(message);
}

export function error(message: string) {
  console.log(red(message));
}
