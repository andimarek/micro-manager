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

export function readFile(path: string, defaultContent: object): Promise<object> {
  const result = new Promise<object>((resolve, reject) => {
    const fd = fs.access(path, fs.constants.R_OK | fs.constants.W_OK, (err) => {
      if (err && err.code === 'ENOENT') {
        console.log(`creating new file ${path}`);
        fs.writeFileSync(path, JSON.stringify(defaultContent));
        resolve(defaultContent);
      } else if (err) {
        console.error(err);
        reject(err);
      }
      const content = JSON.parse(fs.readFileSync(path, 'utf8'));
      resolve(content);
    });
  });
  return result;
}