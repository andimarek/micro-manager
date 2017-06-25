import { dirSync, fileSync } from 'tmp';
import { exec, execFile, execSync } from 'child_process';
import * as fs from 'fs';
import { assertTrue } from './assert';
import { log } from './log';
import { mapLimit as asyncMapLimit } from 'async';
import { inspect as nodeInspect } from 'util';

export function inspect(toPrint: any): string {
  return nodeInspect(toPrint, { depth: undefined });
}

export interface Dictionary<T> { [key: string]: T }
export interface AsyncIterator<T, R> { (item: T): Promise<R> }

export function mapLimit<T, R>(
  arr: Iterable<T> | Dictionary<T>,
  limit: number,
  iterator: AsyncIterator<T, R>
): Promise<(R)[]> {
  return new Promise<(R | undefined)[]>((resolve, reject) => {
    asyncMapLimit<T, R, any>(
      <any>arr,
      limit,
      (item: T, callback) => {
        iterator(item)
          .then(result => callback(null, result))
          .catch(error => callback(error));
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
}

export function firstElement<T>(set: Set<T>): T {
  return set.values().next().value;
}

export function sleep(seconds: number): void {
  execSync(`sleep ${seconds}`);
}

export function newTmpDir(): string {
  return dirSync().name;
}

export function newTmpFile(): string {
  return fileSync().name;
}
export function addToArray<T>(
  collection: { [key: string]: T[] },
  key: string,
  value: T
): void {
  if (collection[key]) {
    collection[key].push(value);
  } else {
    collection[key] = [value];
  }
}

export function removeLastPathSegment(path: string): string {
  const ix = path.lastIndexOf('/');
  if (ix === -1) return path;
  return path.substring(0, ix);
}

export function makePath(part1: string, part2: string): string;
export function makePath(part1: string, part2: string, part3: string): string;
export function makePath(part1: string, part2: string, part3?: string): string {
  if (part3) {
    return makePath(makePath(part1, part2), part3);
  }
  let p1 = part1;
  let p2 = part2;
  if (p1.endsWith('/')) {
    p1 = p1.substring(0, p1.length - 1);
  }
  if (!p2.startsWith('/')) {
    p2 = '/' + p2;
  }
  return p1 + p2;
}

export function fileExists(path: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.exists(path, exists => {
      resolve(exists);
    });
  });
}

export function assertFileExists(path: string): Promise<void> {
  return fileExists(path).then(exists => {
    assertTrue(exists, `file ${path} doesn't exist`);
  });
}

export function executeCommand(
  command: string,
  args: string[],
  path: string
): Promise<string> {
  log.debug(`execute command ${command} ${args} in path ${path}`);
  const result = new Promise((resolve, reject) => {
    execFile(command, args, { cwd: path }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
        return;
      }
      resolve(stdout);
    });
  });
  return result;
}

export function executeCommandInShell(
  command: string,
  path: string
): Promise<string> {
  const result = new Promise((resolve, reject) => {
    exec(command, { cwd: path }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
  return result;
}

export function ensureDirExists(path: string): Promise<any> {
  function handleAccessError(error, resolve, reject) {
    if (error && error.code === 'ENOENT') {
      fs.mkdir(path, mkdirError => {
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
    fs.access(path, fs.constants.W_OK | fs.constants.R_OK, error => {
      if (error) {
        handleAccessError(error, resolve, reject);
      } else {
        ensureDirectory(resolve, reject);
      }
    });
  });
  return result;
}

export function readFile(path: string, defaultContent: any): Promise<any> {
  const result = new Promise<object>((resolve, reject) => {
    const fd = fs.access(path, fs.constants.R_OK | fs.constants.W_OK, err => {
      if (err && err.code === 'ENOENT') {
        fs.writeFileSync(path, JSON.stringify(defaultContent));
        resolve(defaultContent);
        // fs.writeFile(path, JSON.stringify(defaultContent), (writeFileError) => {
        //   console.log('writing file', path);
        //   if (writeFileError) {
        //     reject(writeFileError);
        //   } else {
        //     resolve(defaultContent);
        //   }
        // });
      } else if (err) {
        reject(err);
      }
      const content = JSON.parse(fs.readFileSync(path, 'utf8'));
      resolve(content);
    });
  });
  return result;
}

export function writeFile(filePath: string, content: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(content), error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
