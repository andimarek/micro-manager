import { executeCommand, assertFileExists } from './util';
import { log } from './log';
import * as fs from 'fs';

export function gitClone(url: string, path: string): Promise<string> {
  return executeCommand('git', ['clone', '--progress', url, path], path);
}

export function gitCloneInWorkspace(url:string, workspace: string): Promise<string> {
  return executeCommand('git', ['clone', '--progress', url], workspace);
} 

export function gitInit(path: string): Promise<any> {
  return executeCommand('git', ['init'], path);
}

export function ensureGitRepo(path: string): Promise<any> {
  return gitStatus(path).catch((error) => {
    if (error && (<string>error.message).indexOf('Not a git repository')) {
      return gitInit(path);
    } else {
      throw error;
    }
  });
}

export function gitAdd(repoPath: string, fileInRepo: string): Promise<any> {
  return executeCommand('git', ['add', fileInRepo], repoPath);
}

export function gitCommit(repoPath: string, message: string): Promise<any> {
  return executeCommand('git', ['commit', '-m', message], repoPath);
}

export function ensureFileIsUnderVC(repoPath: string, fileInRepo: string): Promise<any> {
  return assertFileExists(repoPath + '/' + fileInRepo)
    .then(() => gitStatus(repoPath, fileInRepo))
    .then((status: string) => {
      if (status && S(status).startsWith('? ')) {
        return gitAdd(repoPath, fileInRepo);
      }
    });
}

export function ensureFileIsCommited(repoPath: string, fileInRepo: string): Promise<any> {
  return ensureFileIsUnderVC(repoPath, fileInRepo)
    .then(() => gitStatus(repoPath, fileInRepo))
    .then((status) => {
      if (!status) {
        return;
      }
      if (status.startsWith('1') || status.startsWith('2')) {
        return gitAdd(repoPath, fileInRepo).then(() => gitCommit(repoPath, 'backup'));
      } else {
        throw new Error(`unsupported status ${status}`);
      }
    });
}

function gitStatus(path: string): Promise<string>;
function gitStatus(path: string, file: string): Promise<string>;
function gitStatus(path: string, file?: string): Promise<string> {
  const args = ['status', '--porcelain=v2'];
  if (file) {
    args.push(file);
  }
  return executeCommand('git', args, path).then((result) => {
    return result;
  });
}

function gitPull(path: string): void {
  const gitPull = executeCommand('git', ['pull', 'origin'], path);
}

function isClean(path: string): Promise<boolean> {
  const gitStatus = executeCommand('git', ['status', '--porcelain=v2'], path).then((stdout) => {
    return stdout === '';
  });
  return gitStatus;
}