import {createMainContextProxyIdentifier, createTaskHostContextProxyIdentifier} from '../ipc/threadService'

export interface TaskDescription {
  name: string;
}

export abstract class MainThreadTasksShape {
  $registerTask(taskDesc: TaskDescription): void { throw new Error('not implemented'); }
}

export abstract class TaskThreadTasksShape {
  $loadTaskFile(path: string): void { throw new Error('not implemented'); }
}

export const MainContext = {
  MainThreadTasks: createMainContextProxyIdentifier<MainThreadTasksShape>('MainThreadTasks', MainThreadTasksShape)
}

export const TaskHostContext = {
  TaskThreadTasks: createTaskHostContextProxyIdentifier<TaskThreadTasksShape>('TashThreadTasks', TaskThreadTasksShape)
}