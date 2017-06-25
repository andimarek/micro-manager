import { executeCommand, assertFileExists } from './util';
import { log } from './log';
import * as fs from 'fs';
import { includes } from 'lodash';

export function setOrigin(repoPath: string, url: string): Promise<any> {
  return getRemotes(repoPath)
    .then((remotes: string[]) => {
      log.debug(`remote repos:`, remotes);
      if (includes(remotes, 'origin')) {
        throw new Error('there is already a origin remote');
      }
    })
    .then(() => {
      return executeCommand('git', ['remote', 'add', 'origin', url], repoPath);
    });
}

export function getRemotes(repoPath: string): Promise<string[]> {
  return executeCommand('git', ['remote', 'show'], repoPath).then(output => {
    return output.split('\n');
  });
}

export function gitClone(url: string, path: string): Promise<string> {
  return executeCommand('git', ['clone', '--progress', url, path], path);
}

export function gitCloneInWorkspace(
  url: string,
  workspace: string
): Promise<string> {
  return executeCommand('git', ['clone', '--progress', url], workspace);
}

export function gitInit(path: string): Promise<any> {
  return executeCommand('git', ['init'], path);
}

export function setEmailAndUser(
  path: string,
  email: string,
  user: string
): Promise<any> {
  return executeCommand('git', ['config', 'user.email', email], path).then(() =>
    executeCommand('git', ['config', 'user.name', user], path)
  );
}

export function ensureGitRepo(path: string): Promise<any> {
  return gitStatus(path).catch(error => {
    if (
      error &&
      error.error &&
      error.error.message &&
      (<string>error.error.message).indexOf('Not a git repository')
    ) {
      return gitInit(path).then(() =>
        setEmailAndUser(path, 'micro-manager@example.com', 'micro-manager')
      );
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

export function ensureFileIsUnderVC(
  repoPath: string,
  fileInRepo: string
): Promise<any> {
  return assertFileExists(repoPath + '/' + fileInRepo)
    .then(() => gitStatus(repoPath, fileInRepo))
    .then((status: string) => {
      if (status && status.startsWith('? ')) {
        return gitAdd(repoPath, fileInRepo);
      }
    });
}

export function ensureFileIsCommited(
  repoPath: string,
  fileInRepo: string
): Promise<any> {
  return ensureFileIsUnderVC(repoPath, fileInRepo)
    .then(() => gitStatus(repoPath, fileInRepo))
    .then(status => {
      if (!status) {
        return;
      }
      if (status.startsWith('1') || status.startsWith('2')) {
        return gitAdd(repoPath, fileInRepo).then(() =>
          gitCommit(repoPath, 'backup')
        );
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
  return executeCommand('git', args, path).then(result => {
    return result;
  });
}

export function pullOrigin(repoPath: string): Promise<string> {
  return executeCommand('git', ['pull', 'origin', 'master'], repoPath);
}

export function gitFetchOrigin(repoPath: string): Promise<string> {
  return executeCommand('git', ['fetch', 'origin'], repoPath);
}

export function checkoutOrigin(
  repoPath: string,
  branchName: string
): Promise<string> {
  return executeCommand(
    'git',
    ['checkout', `-b`, branchName, 'origin/master'],
    repoPath
  );
}
function isClean(path: string): Promise<boolean> {
  const gitStatus = executeCommand(
    'git',
    ['status', '--porcelain=v2'],
    path
  ).then(stdout => {
    return stdout === '';
  });
  return gitStatus;
}
