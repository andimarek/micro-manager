import { fork } from 'child_process';
import { createServer, Server } from 'net';
import { generateUuid } from '../common/uuid';
import { join } from 'path';
import { tmpdir } from 'os';
import { IMessagePassingProtocol, Protocol } from "../ipc/ipc";
import { createProxyProtocol } from "../ipc/ipcRemoteCom";
import { ThreadService } from "../ipc/abstractThreadService";
import { MainThreadTasksShape, TaskDescription, MainContext, TaskHostContext, TaskThreadTasksShape } from "./extensionHostProtocol";
import { createMainContextProxyIdentifier } from "../ipc/threadService";
import { log } from '../log';
import { Command, CommandResult, addCommand } from "../inputreader";
import { getRepositoryByProjectName } from '../domain';


export let threadService: ThreadService;
let taskHostThreads: TaskThreadTasksShape;

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

const logPrefix = "[ExtHost] ";
class MainThreadTasks implements MainThreadTasksShape {

  $getRepoForProject(projectName: string): Promise<Repository | undefined> {
    const repo = getRepositoryByProjectName(projectName);
    log.debug('get repo for project ', projectName, ' with result: ', repo);
    return Promise.resolve(repo);
  }

  $log(message: any, ...optional: any[]): void {
    log(logPrefix + message, ...optional);
  }
  $logError(message: any, ...optional: any[]): void {
    log.error(logPrefix + message, ...optional);
  }
  $logDebug(message: any, ...optional: any[]): void {
    log.debug(logPrefix + message, ...optional);
  }

  $registerTask(taskDesc: TaskDescription): void {
    log('registering new task: ', taskDesc);
    const commandArgs = taskDesc.args.map(name => ({ name }));
    const command: Command = {
      name: taskDesc.name,
      arguments: commandArgs,
      execute(args: string[]): Promise<CommandResult> {
        return taskHostThreads.$executeTask(taskDesc.name, args).then(() => ({ success: true }));
      }
    };
    addCommand(command);
  }
}

export function startExtHostProcess(): Promise<any> {
  const modulePath = './dist/extensionHost';
  return tryListenOnPipe().then(([server, hook]) => {
    const childProcess = fork(modulePath, [hook]);

    return new Promise<IMessagePassingProtocol>((resolve, reject) => {
      let handle = setTimeout(() => reject('timeout'), 60 * 1000);
      server.on('connection', socket => {
        clearTimeout(handle);
        const protocol = new Protocol(socket);
        resolve(protocol);
      });

    }).then(protocol => {
      return new Promise<any>((resolve, reject) => {
        protocol.onMessage(msg => {
          log.debug('received msg', msg);
          if (msg === 'ready') {
            // 1) Host is ready to receive messages, initialize it
            protocol.send('egal');
            // return this.createExtHostInitData().then(data => protocol.send(stringify(data)));
          } else if (msg === 'initialized') {
            log.debug('task host is initialized');
            const remoteCom = createProxyProtocol(protocol);
            threadService = new ThreadService(remoteCom, true);
            threadService.set(MainContext.MainThreadTasks, new MainThreadTasks());
            taskHostThreads = threadService.get(TaskHostContext.TaskThreadTasks);
            log('task host loaded');
            resolve();
          }
          return undefined;
        });
      });
    });
  });
}

export function loadExtensionFile(path: string): Promise<any> {
  log.debug('loading tasks project from ', path);
  taskHostThreads.$loadTaskFile(path);
  return Promise.resolve();
}