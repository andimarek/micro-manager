import * as net from 'net';
import { log } from './log';
import { Repository, Data, mergeData, setData, getData } from './domain';
import { EventEmitter } from 'events';
import { assertDefined } from './assert';
import { serve, Server, connect, Client } from './ipc/ipc';

const DEFAULT_PORT = 8220;
const PUSH_COMMAND = 'PUSH_COMMAND';
const PULL_COMMAND = 'PUSH_COMMAND';
const ENCODING = 'utf-8';
const DEFAULT_CHANNEL = 'DEFAULT_CHANNEL';

export function openServer() {
  log(`opening server at port ${DEFAULT_PORT}`);
  const channel = {
    call(command: string, arg: any): Promise<any> {
      log(`received command ${command}`);
      switch (command) {
        case PUSH_COMMAND:
          return Promise.resolve(handlePush(<Data>arg));
        case PULL_COMMAND:
          return Promise.resolve(handlePull());
        default:
          return Promise.resolve(false);
      }
    }
  };
  serve(DEFAULT_PORT)
    .then((server: Server) => {
      server.registerChannel(DEFAULT_CHANNEL, channel);
    })
    .catch((reason) => {
      if (reason.code === 'EADDRINUSE') {
        log.error('could not open server: port is used');
      } else {
        log.error('could not open server ... exit');
        process.exit(1);
      }
    });
  // const server = net.createServer((socket: net.Socket) => {
  //   console.log('new client connection');
  //   socket.setEncoding(ENCODING);
  //   socket.on('data', (command: string) => {
  //     console.log('command received:', command);
  //     switch (command) {
  //       case PUSH_COMMAND:
  //         receiveData(socket);
  //     }
  //   });
  // });

  // server.on('error', (e: any) => {
  //   if (e.code == 'EADDRINUSE') {
  //     log('Address is already in use...no server is started');
  //   }
  // });
  // log(`opening server on port ${DEFAULT_PORT}`);
  // server.listen(DEFAULT_PORT);
}

function handlePush(otherData: Data): boolean {
  log(`received data to merge:`, otherData);
  const mergedData = mergeData(otherData);
  if (mergedData) {
    setData(mergedData);
    return true;
  } else {
    return false;
  }
}

function handlePull(): Data {
  log('received pull command: sending data to client');
  return getData();
}


export function push(host: string) {
  log(`pushing data with ${host}`);
  connect(DEFAULT_PORT)
    .then((client: Client): Promise<boolean> => {
      const channel = client.getChannel(DEFAULT_CHANNEL);
      const data = getData();
      const callResult = channel.call(PUSH_COMMAND, data);
      callResult.then(() => client.dispose(), () => client.dispose());
      return callResult;
    })
    .then((result:boolean) => {
      if (result) {
        log.success('push successful');
      } else {
        log.error('push failed');
      }
    });
}

export function pull(host: string) {
  log(`pulling data from ${host}`);
  connect(DEFAULT_PORT)
    .then((client: Client): Promise<Data> => {
      const channel = client.getChannel(DEFAULT_CHANNEL);
      const data = getData();
      const callResult = channel.call(PULL_COMMAND, data);
      callResult.then(() => client.dispose(), () => client.dispose());
      return callResult;
    })
    .then((otherData:Data) => {
      log('result of pull:', otherData);
      const mergedData = mergeData(otherData);
      if (mergedData) {
        log.success('merged data after pull', mergedData);
        setData(mergedData);
      } else {
        log.error('pull failed: could not merge data');
      }
    });
}



