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

(<any>global).taskApi = {};
const taskApi: TaskApi = (<any>global).taskApi;
taskApi.registerTask = registerTask;
