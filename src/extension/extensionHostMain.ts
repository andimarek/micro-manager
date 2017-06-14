import { createConnection } from 'net';
import { IMessagePassingProtocol, Protocol } from '../ipc/ipc';
import { parse } from '../ipc/marshalling';
import { createProxyProtocol } from '../ipc/ipcRemoteCom';
import { ThreadService } from "../ipc/abstractThreadService";
import { MainContext, TaskThreadTasksShape, TaskHostContext, MainThreadTasksShape } from "./extensionHostProtocol";
// recursive imports ... not cool
import { executeTask } from './extension-api-impl';

export let mainThreadTasks: MainThreadTasksShape;

const nodeRequire = (path: string): void => {
	try {
		eval(`require('${path}');`);
	} catch (e) {
		console.error('exception ', e);
	}
};

const socketName = process.argv[2];

// log('starting extension host process with socket');

class TaskHostTasks implements TaskThreadTasksShape {

	$executeTask(name: string, args: any[]): Promise<any> {
		// log.debug('executing task ', name);
		return executeTask(name, args);
	}

	$loadTaskFile(path: string): void {
		// log.debug('loading dynamically task file from ', path);
		nodeRequire(path);
	}

}


const p = new Promise<IMessagePassingProtocol>((resolve, reject) => {

	const socket = createConnection(socketName, () => {
		socket.removeListener('error', reject);
		resolve(new Protocol(socket));
	});
	socket.once('error', reject);

}).then(protocol => {
	const first = protocol.onMessage(raw => {
		// console.log('received message', raw);
		first.dispose();

		// const initData = parse(raw);
		const remoteCom = createProxyProtocol(protocol);
		const threadService = new ThreadService(remoteCom, false);
		threadService.set(TaskHostContext.TaskThreadTasks, new TaskHostTasks());

		mainThreadTasks = threadService.get(MainContext.MainThreadTasks);


		// setTimeout(() => {
		// 	console.log('calling register task from task process');
		// 	mainThreadTasks.$registerTask({ name: 'some task' });
		// }, 2000);

		// console.log('sending initialized');
		protocol.send('initialized');
	});
	protocol.send('ready');
});


