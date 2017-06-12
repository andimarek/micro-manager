interface TaskConfig {
    name: string;
    args: string[];
}
interface TaskCallback {
    (args: string[]): Promise<any>;
}

interface TaskApi {
    registerTask(taskConfig: TaskConfig, callback: TaskCallback);
}
declare const taskApi: TaskApi;
