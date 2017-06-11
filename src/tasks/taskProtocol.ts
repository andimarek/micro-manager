import {createMainContextProxyIdentifier} from '../ipc/threadService'

export interface TaskDescription {
  name: string;
}

export abstract class MainThreadTasksShape {
  $registerTask(taskDesc: TaskDescription): void { throw new Error('not implemented'); }
}

export const MainContext = {
  MainThreadTasks: createMainContextProxyIdentifier<MainThreadTasksShape>('MainThreadTasks', MainThreadTasksShape)
}

export const TaskHostContext = {

}