import * as net from 'net';
import { log } from './log';
import { Repository, Data, mergeData, setData, getData } from './domain';
import { EventEmitter } from 'events';
import { assertDefined } from './assert';
import { serve, Server, connect, Client } from './ipc/ipc';

const DEFAULT_PORT = 8220;
const PUSH_COMMAND = 'PUSH_COMMAND';
const PULL_COMMAND = 'PULL_COMMAND';
const ENCODING = 'utf-8';
const DEFAULT_CHANNEL = 'DEFAULT_CHANNEL';


export function openServer(): Promise<any> {
  log(`opening server at port ${DEFAULT_PORT}`);
  const channel = {
    call(command: string, arg: any): Promise<any> {
      log(`received command ${command}`);
      switch (command) {
        case PUSH_COMMAND:
          return handlePush(<Data>arg).then( () => true, () => false);
        case PULL_COMMAND:
          return Promise.resolve(handlePull());
        default:
          return Promise.resolve(false);
      }
    }
  };
  return serve(DEFAULT_PORT)
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
}

function handlePush(otherData: Data): Promise<void> {
  log(`received data to merge:`, otherData);
  const mergedData = mergeData(otherData);
  if (mergedData) {
    return setData(mergedData);
  } else {
    return Promise.reject('');
  }
}

function handlePull(): Data {
  log.debug('received pull command: sending data to client');
  return getData();
}


export function push(host: string): Promise<any> {
  log.debug(`pushing data with ${host}`);
  return connect(DEFAULT_PORT)
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
      return result;
    });
}

export function pull(host: string): Promise<any> {
  log.debug(`pulling data from ${host}`);
  return connect(DEFAULT_PORT)
    .then((client: Client): Promise<Data> => {
      const channel = client.getChannel(DEFAULT_CHANNEL);
      const data = getData();
      const callResult = channel.call(PULL_COMMAND, data);
      callResult.then(client.dispose, client.dispose);
      return callResult;
    })
    .then((otherData:Data) => {
      log('result of pull:', otherData);
      const mergedData = mergeData(otherData);
      if (mergedData) {
        setData(mergedData);
        log.success('pull successful. new data after pull', mergedData);
      } else {
        log.error('pull failed: could not merge data');
      }
    });
}



