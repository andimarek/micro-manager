import { mainThreadTasks } from './extensionHostMain';


const registeredTasks: { [name: string]: TaskConfig } = {};
const callbacks: { [name: string]: TaskCallback } = {};

export function executeTask(name: string, args: string[]): Promise<any> {
  const callback = callbacks[name];
  return callback(args);
}

function registerTask(taskConfig: TaskConfig, callback: TaskCallback): Promise<void> {
  registeredTasks[taskConfig.name] = taskConfig;
  callbacks[taskConfig.name] = callback;
  mainThreadTasks.$registerTask(taskConfig);
  return Promise.resolve();
}

function getRepoForProject(projectName: string): Repository | undefined {
  return mainThreadTasks.$getRepoForProject(projectName);
}

const logger: Logger = <any>((message: string, ...optional: any[]): void => {
  mainThreadTasks.$log(message, ...optional);
});

logger.error = (message: string, ...optional: any[]): void => {
  mainThreadTasks.$logError(message, ...optional);
};

logger.debug = (message: string, ...optional: any[]): void => {
  mainThreadTasks.$logDebug(message, ...optional);
}

(<any>global).mm = {};
const mm: ExtensionApi = (<any>global).mm;
mm.registerTask = registerTask;
mm.log = logger;
