import {mainThreadTasks} from './taskProcess';


function registerTask(taskConfig: TaskConfig, callback: TaskCallback) {
  mainThreadTasks.$registerTask(taskConfig);
}
(<any>global).taskApi = {};
const taskApi: TaskApi = (<any>global).taskApi;
taskApi.registerTask = registerTask;
