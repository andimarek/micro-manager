
interface TaskConfig {
    name: string;
    args: string[];
}
interface TaskCallback {
    (args: string[]): Promise<any>;
}

interface Logger {
    (message: string, ...optional: any[]): void;
    error(message: string, ...optional: any[]): void;
    debug(message: string, ...optional: any[]): void;
}

interface Repository {
    type: string;
    url: string;
}

interface ExtensionApi {
    registerTask(taskConfig: TaskConfig, callback: TaskCallback): Promise<void>;
    getRepoForProject(projectName: string): Promise<Repository | undefined>;
    log: Logger;
}
declare const mm: ExtensionApi;
