import { Project } from './domain';
import { log } from './log';

export interface TaskConfig {
  name: string;
}
export interface TaskCallback {
  (): Promise<any>;
}

const tasks: TaskConfig[] = [];

export function registerTask(taskConfig: TaskConfig, callback: TaskCallback) {
  log('new task registered: ', taskConfig.name);
  tasks.push(taskConfig);
}