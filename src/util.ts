import { dirSync } from 'tmp';
import * as fs from 'fs';

export function newTmpDir(): string {
  return dirSync().name;
}

export function ensureDirExists(path: string): Promise<any> {

  function handleAccessError(error, resolve, reject) {
    if (error && error.code === 'ENOENT') {
      fs.mkdir(path, (mkdirError) => {
        if (mkdirError) {
          reject(mkdirError);
        } else {
          resolve(mkdirError);
        }
      });
    } else if (error) {
      reject(error);
    }
  }

  function ensureDirectory(resolve, reject) {
    fs.stat(path, (error, stats) => {
      if (error) {
        reject(error);
        return;
      } 
      if (!stats.isDirectory()) {
        reject(`${path} is not a directory`);
        return;
      }
      resolve();
    });

  }

  const result = new Promise<any>((resolve, reject) => {
    fs.access(path, fs.constants.W_OK | fs.constants.R_OK, (error) => {
      if (error) {
        handleAccessError(error, resolve, reject);
      } else {
        ensureDirectory(resolve, reject);
      }
    });
  });
  return result;
}