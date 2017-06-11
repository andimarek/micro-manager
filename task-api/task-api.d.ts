export interface TaskConfig {
    name: string;
}
export interface TaskCallback {
    (): Promise<any>;
}
export declare function registerTask(taskConfig: TaskConfig, callback: TaskCallback): string;
