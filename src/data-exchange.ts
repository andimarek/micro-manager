import * as net from 'net';
import { log } from './log';
import { Repository, Data, mergeData, setData, getData } from './domain';
import { EventEmitter } from 'events';
import { assertDefined } from './assert';
import { serve, Server, connect, Client } from './ipc/ipc';

const DEFAULT_PORT = 8220;
const PUSH_COMMAND = 'PUSH_COMMAND';
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


export function push(host: string) {
  log(`pushing data with ${host}`);

  connect(DEFAULT_PORT).then((client: Client) => {
    const channel = client.getChannel(DEFAULT_CHANNEL);
    const data = getData();
    channel.call(PUSH_COMMAND, data).then((result) => {
      log('result of push:', result);
    });
  });
  // client.connect(DEFAULT_PORT, host, function () {
  //   log(`connected to ${host}`);
  //   client.write(PUSH_COMMAND, ENCODING);
  //   log('sending data', JSON.stringify(getData()));
  //   client.write(JSON.stringify(getData()));
  // });

  // client.on('data', function (data) {
  //   console.log('Received on client', + data);
  //   client.destroy();
  // });

  // client.on('close', function () {
  //   log('Connection closed');
  // });

}




// export function getDelayedChannel<T extends IChannel>(promise: Promise<IChannel>): T {
//   const call = (command, arg) => promise.then(c => c.call(command, arg));
//   return { call } as T;
// }

// export function eventToCall(event: Event<any>): Promise<any> {
//   let disposable: IDisposable;

//   return new Promise<any>(
//     (c, e) => disposable = event(p),
//   );
// }

// export function eventFromCall<T>(channel: IChannel, name: string): Event<T> {
//   let promise: Promise<any>;

//   const emitter = new EventEmitter();
//   // ({
//   //   onFirstListenerAdd: () => {
//   //     promise = channel.call(name, null).then(null, err => null, e => emitter.fire(e));
//   //   },
//   //   onLastListenerRemove: () => {
//   //     promise.cancel();
//   //     promise = null;
//   //   }
//   // });

//   return emitter.event;
// }