import {dirSync} from 'tmp';

export function newTmpDir(): string {
  return dirSync().name;
}