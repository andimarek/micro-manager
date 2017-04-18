import { Repository, Config } from './domain';
import { exec, execFile } from 'child_process';
import { log } from './log';
import { newTmpDir } from './util';

export function checkoutIntoTmp(repos: Repository[]): Promise<void> {
  const tmpDir = newTmpDir();
  const promises: Promise<string>[] = [];
  log(`tmpDir: ${tmpDir}`);
  for (const repo of repos) {
    log(`checking out ${repo.url}`);
    promises.push(gitClone(repo.url, tmpDir));
  }
  return Promise.all(promises).then(() => { 
    log.success('checked out all repos') 
  });
}

export function checkout(repos: Repository[], config: Config) {
  for (const repo of repos) {
    console.log(`checking out ${repo.url}`);
    gitClone(repo.url, config.rootPath!);
  }
}

function gitClone(url: string, path: string): Promise<string> {
  return executeCommand('git', ['clone', '--progress', url], path);
}

function gitStatus(path: string): void {
  const gitStatus = executeCommand('git', ['status'], path );
}

function gitPull(path: string): void {
  const gitPull = executeCommand('git', ['pull', 'origin'], path);
}


export function isClean(path: string): Promise<boolean> {
  const gitStatus = executeCommand('git', ['status', '--porcelain=v2'], path).then((stdout) => {
    return stdout === '';
  });
  return gitStatus;
  // const result = new Promise<string>((resolve) => {
  //   let buffer: Buffer = Buffer.alloc(0);

  //   gitStatus.stdout.on('data', (data: Buffer) => {
  //     buffer = Buffer.concat([buffer, data]);
  //     log('received data', buffer.length);
  //   });
  //   gitStatus.stdout.on('end', (code) => {
  //     log('done');
  //     resolve(buffer.toString('utf-8'));
  //   });
  // });
  // return result.then((output) => {
  //   return output === '';
  // });
}

function executeCommand(command: string, args: string[], path: string): Promise<string> {
  const result = new Promise((resolve, reject) => {
    execFile(command, args, { cwd: path }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
      // console.log(`stdout: ${stdout}`);
      // console.log(`stderr: ${stderr}`);
    });
  });
  return result;
}

