import { createConnection } from 'net';
import { IMessagePassingProtocol, Protocol } from '../ipc/ipc';
import { parse } from '../ipc/marshalling';
import { createProxyProtocol } from '../ipc/ipcRemoteCom';
import { ThreadService } from "../ipc/abstractThreadService";
import { MainContext } from "./taskProtocol";
const nodeRequire: (path: string) => void = eval('require');


// const path = process.argv[2];
const socketName = process.argv[2];

console.log('starting task process with socket', process.argv[2]);


const p = new Promise<IMessagePassingProtocol>((resolve, reject) => {

	const socket = createConnection(socketName, () => {
		socket.removeListener('error', reject);
		resolve(new Protocol(socket));
	});
	socket.once('error', reject);

}).then(protocol => {
	const first = protocol.onMessage(raw => {
		console.log('received message', raw);
		first.dispose();
		// const initData = parse(raw);
		const remoteCom = createProxyProtocol(protocol);
		const threadService = new ThreadService(remoteCom, false);
		const mainThreadTasks = threadService.get(MainContext.MainThreadTasks);

		setTimeout(() => {
			console.log('calling register task from task process');
			mainThreadTasks.$registerTask({ name: 'some task' });
		}, 2000);
		console.log('sending initialized');
		protocol.send('initialized');
	});
	protocol.send('ready');
});



