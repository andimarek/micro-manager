import { Repository, Config } from './domain';
import { spawn } from 'child_process';

export function checkout(repos: Repository[], config: Config) {
  for (const repo of repos) {
    console.log(`checking out ${repo.url}`);
    gitClone(repo.url, config.rootPath);
  }
}

function gitClone(url: string, path: string): void {
  const clone = spawn('git', ['clone', '--progress', url], {cwd: path});

  clone.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  clone.stderr.on('data', (data) => {
    console.log(`${data}`);
  });

  clone.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}