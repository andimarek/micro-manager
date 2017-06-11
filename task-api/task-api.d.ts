interface TaskConfig {
    name: string;
}
interface TaskCallback {
    (): Promise<any>;
}

interface TaskApi {
    registerTask(taskConfig: TaskConfig, callback: TaskCallback);
}
declare const taskApi: TaskApi;
