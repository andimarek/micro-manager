import { fork } from 'child_process';
import { createServer, Server } from 'net';
import { generateUuid } from '../common/uuid';
import { join } from 'path';
import { tmpdir } from 'os';
import { IMessagePassingProtocol, Protocol } from "../ipc/ipc";
import { createProxyProtocol } from "../ipc/ipcRemoteCom";
import { ThreadService } from "../ipc/abstractThreadService";
import { MainThreadTasksShape, TaskDescription, MainContext } from "./taskProtocol";
import { createMainContextProxyIdentifier } from "../ipc/threadService";


function generateRandomPipeName(): string {
  const randomSuffix = generateUuid();
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\vscode-${randomSuffix}-sock`;
  } else {
    // Mac/Unix: use socket file
    return join(tmpdir(), `vscode-${randomSuffix}.sock`);
  }
}

function tryListenOnPipe(): Promise<[Server, string]> {
  return new Promise<[Server, string]>((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    const hook = generateRandomPipeName();
    server.listen(hook, () => {
      server.removeListener('error', reject);
      resolve([server, hook]);
    });
  });
}

class MainThreadTasks implements MainThreadTasksShape {

  $registerTask(taskDesc: TaskDescription): void {
    console.log('registering new task with', taskDesc);
  }
}

export function startTaskProcess() {
  const modulePath = './dist/taskProcess';
  tryListenOnPipe().then(([server, hook]) => {
    console.log('hook', hook);
    const childProcess = fork(modulePath, [hook]);

    const promise = new Promise<IMessagePassingProtocol>((resolve, reject) => {
      let handle = setTimeout(() => reject('timeout'), 60 * 1000);
      server.on('connection', socket => {
        console.log('new client connection');
        clearTimeout(handle);
        const protocol = new Protocol(socket);
        resolve(protocol);
      });
      // }).then(protocol => {
      // 	return protocol;

    }).then(protocol => {

      protocol.onMessage(msg => {
        console.log('received msg', msg);
        if (msg === 'ready') {
          // 1) Host is ready to receive messages, initialize it
          protocol.send('egal');
          // return this.createExtHostInitData().then(data => protocol.send(stringify(data)));
        } else if (msg === 'initialized') {
          console.log('initialized');
          // 2) Host is initialized
          const remoteCom = createProxyProtocol(protocol);
          const threadService = new ThreadService(remoteCom, true);
          threadService.set(MainContext.MainThreadTasks, new MainThreadTasks());
        }
        return undefined;
      });
    });
  });
}