import * as net from 'net';
import { log } from './log';

const DEFAULT_PORT = 8220;
const EXCHANGE_COMMAND = 'PUSH_COMMAND';
const ENCODING = 'utf-8';

export function openServer() {
  const server = net.createServer((socket: net.Socket) => {
    console.log('new client connection');
    socket.setEncoding(ENCODING);
    socket.on('data', (data) => {
      console.log('data received', data);
    });
  });

  server.on('error', (e: any) => {
    if (e.code == 'EADDRINUSE') {
      log('Address is already in use...no server is started');
    }
  });
  log(`opening server on port ${DEFAULT_PORT}`);
  server.listen(DEFAULT_PORT);
}

export function push(host: string) {
  const client = new net.Socket();
  log(`syncing data with ${host}`);

  client.connect(DEFAULT_PORT, host, function () {
    log(`connected to ${host}`);
    client.write(EXCHANGE_COMMAND, ENCODING);
  });

  client.on('data', function (data) {
    console.log('Received on client', + data);
    client.destroy();
  });

  client.on('close', function () {
    console.log('Connection closed');
  });

}