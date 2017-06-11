import {mainThreadTasks} from './taskProcess';

interface TaskConfig {
  name: string;
}
interface TaskCallback {
  (): Promise<any>;
}


function registerTask(taskConfig: TaskConfig, callback: TaskCallback) {
  mainThreadTasks.$registerTask(taskConfig);
}

const myGlobal = <any>global;
myGlobal.taskApi = myGlobal.taskApi || {};
myGlobal.taskApi.registerTask = registerTask;
