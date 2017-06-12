import { mainThreadTasks } from './taskProcess';


const registeredTasks: { [name: string]: TaskConfig } = {};
const callbacks: { [name: string]: TaskCallback } = {};

export function executeTask(name: string, args: string[]): Promise<any> {
  const callback = callbacks[name];
  return callback(args);
}

function registerTask(taskConfig: TaskConfig, callback: TaskCallback) {
  registeredTasks[taskConfig.name] = taskConfig;
  callbacks[taskConfig.name] = callback;
  mainThreadTasks.$registerTask(taskConfig);
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

(<any>global).taskApi = {};
const taskApi: TaskApi = (<any>global).taskApi;
taskApi.registerTask = registerTask;
taskApi.log = logger;
