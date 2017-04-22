import { dirSync } from 'tmp';
import { exec, execFile, execSync } from 'child_process';
import * as fs from 'fs';
import { assertTrue } from './assert';

export function sleep(seconds: number): void {
  execSync(`sleep ${seconds}`);
}

export function newTmpDir(): string {
  return dirSync().name;
}

export function fileExists(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.exists(path, (exists) => {
      resolve(exists);
    });
  });
}

export function assertFileExists(path: string): Promise<void> {
  return fileExists(path).then((exists) => {
    assertTrue(exists, `file ${path} doesn't exist`);
  });
}

export function executeCommand(command: string, args: string[], path: string): Promise<string> {
  const result = new Promise((resolve, reject) => {
    execFile(command, args, { cwd: path }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
  return result;
}

export function executeCommandInShell(command: string, path: string): Promise<string> {
  const result = new Promise((resolve, reject) => {
    exec(command,{ cwd: path }, (error, stdout, stderr) => {
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

export function writeFile(filePath: string, content: object): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(content), (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}