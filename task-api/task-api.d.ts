interface TaskConfig {
    name: string;
}
interface TaskCallback {
    (): Promise<any>;
}
declare function registerTask(taskConfig: TaskConfig, callback: TaskCallback): string;
