import { Repository, Config } from './domain';
import { spawn, exec, execFile } from 'child_process';
import { log } from './log';

export function checkout(repos: Repository[], config: Config) {
  for (const repo of repos) {
    console.log(`checking out ${repo.url}`);
    gitClone(repo.url, config.rootPath);
  }
}

function gitClone(url: string, path: string): Promise<void> {
  return executeCommand('git', ['clone', '--progress', url], path ).then( () => {});
}

function gitStatus(path: string): void {
  const gitStatus = spawn('git', ['status'], { cwd: path });
}

function gitPull(path: string): void {
  const gitPull = spawn('git', ['pull', 'origin']);
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
    execFile(command, args, {cwd: path}, (error, stdout, stderr) => {
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

