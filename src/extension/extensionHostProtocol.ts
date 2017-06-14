import { createMainContextProxyIdentifier, createTaskHostContextProxyIdentifier } from '../ipc/threadService'

export interface TaskDescription {
  name: string;
  args: string[];
}

export abstract class MainThreadTasksShape {
  $registerTask(taskDesc: TaskDescription): void { throw new Error('not implemented'); }
  $getRepoForProject(projectName: string): Repository | undefined {throw new Error('not implemented') };
  $log(message:string, ...optional: any[]): void { throw new Error('not implemented'); }
  $logError(message:string, ...optional: any[]): void { throw new Error('not implemented'); };
  $logDebug(message:string, ...optional: any[]): void { throw new Error('not implemented'); };
}

export abstract class TaskThreadTasksShape {
  $loadTaskFile(path: string): void { throw new Error('not implemented'); }
  $executeTask(name: string, args: any[]): Promise<any> { throw new Error('not implemented'); }
}

export const MainContext = {
  MainThreadTasks: createMainContextProxyIdentifier<MainThreadTasksShape>('MainThreadTasks', MainThreadTasksShape)
}

export const TaskHostContext = {
  TaskThreadTasks: createTaskHostContextProxyIdentifier<TaskThreadTasksShape>('TashThreadTasks', TaskThreadTasksShape)
}
