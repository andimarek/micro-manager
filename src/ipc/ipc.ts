/* tslint:disable */
import * as net from 'net';
import { log } from '../log';
import { Repository, Data, mergeData, setData, getData } from '../domain';
import { Emitter, Event } from '../common/event';
import { IDisposable, Disposable, toDisposable } from '../common/lifecycle';
import { assertDefined } from '../assert';
import * as R from 'ramda';

enum RequestType {
  Common,
  Cancel,
}

interface IRawRequest {
  id: number;
  type: RequestType;
  channelName?: string;
  name?: string;
  arg?: any;
}

interface IRequest {
  raw: IRawRequest;
  // emitter?: EventEmitter;
  flush?: (() => void) | null;
}

enum ResponseType {
  Initialize,
  Success,
  Progress,
  Error,
  ErrorObj,
}

interface IRawResponse {
  id: number;
  type: ResponseType;
  data: any;
}

interface IHandler {
  (response: IRawResponse): void;
}

export interface IMessagePassingProtocol {
  send(request: any): void;
  onMessage(callback: (response: any) => void): IDisposable;
}

enum State {
  Uninitialized,
  Idle,
}

export interface IChannel {
  call(command: string, arg: any): Promise<any>;
}

export interface IServer {
  registerChannel(channelName: string, channel: IChannel): void;
}

export interface IClient {
  getChannel<T extends IChannel>(channelName: string): T;
}

export class IPCServer {
  private channels: { [name: string]: IChannel };
  private activeRequests: { [id: number]: IDisposable } | null;

  constructor(private protocol: IMessagePassingProtocol) {
    this.channels = Object.create(null);
    this.activeRequests = Object.create(null);
    this.protocol.onMessage(r => this.onMessage(r));
    this.protocol.send(<IRawResponse>{ type: ResponseType.Initialize });
  }

  registerChannel(channelName: string, channel: IChannel): void {
    this.channels[channelName] = channel;
  }

  private onMessage(request: IRawRequest): void {
    switch (request.type) {
      case RequestType.Common:
        this.onCommonRequest(request);
        break;

      case RequestType.Cancel:
        this.onCancelRequest(request);
        break;
    }
  }

  private onCommonRequest(request: IRawRequest): void {
    const channel = this.channels[<string>request.channelName];
    let promise: Promise<any>;

    try {
      promise = channel.call(<string>request.name, request.arg);
    } catch (err) {
      promise = Promise.reject(err);
    }

    const id = request.id;

    const requestPromise = promise.then(
      data => {
        this.protocol.send(
          <IRawResponse>{ id, data, type: ResponseType.Success }
        );
        delete this.activeRequests![request.id];
      },
      data => {
        if (data instanceof Error) {
          this.protocol.send(
            <IRawResponse>{
              id,
              data: {
                message: data.message,
                name: data.name,
                stack: data.stack ? data.stack.split('\n') : void 0,
              },
              type: ResponseType.Error,
            }
          );
        } else {
          this.protocol.send(
            <IRawResponse>{ id, data, type: ResponseType.ErrorObj }
          );
        }

        delete this.activeRequests![request.id];
      } /*data => {
			this.protocol.send(<IRawResponse> { id, data, type: ResponseType.Progress });
		}*/
    );

    this.activeRequests![
      request.id
    ] = toDisposable(/*() => requestPromise.cancel()*/);
  }

  private onCancelRequest(request: IRawRequest): void {
    const disposable = this.activeRequests![request.id];

    if (disposable) {
      disposable.dispose();
      delete this.activeRequests![request.id];
    }
  }

  public dispose(): void {
    Object.keys(this.activeRequests).forEach(id => {
      this.activeRequests![<any>id].dispose();
    });

    this.activeRequests = null;
  }
}

export class IPCClient implements IClient {
  private state: State;
  private bufferedRequests: IRequest[] | null;
  private handlers: { [id: number]: IHandler };
  private lastRequestId: number;

  constructor(private protocol: IMessagePassingProtocol) {
    this.state = State.Uninitialized;
    this.bufferedRequests = [];
    this.handlers = Object.create(null);
    this.lastRequestId = 0;
    this.protocol.onMessage(r => this.onMessage(r));
  }

  getChannel<T extends IChannel>(channelName: string): T {
    const call = (command, arg) => this.request(channelName, command, arg);
    return { call } as T;
  }

  private request(channelName: string, name: string, arg: any): Promise<any> {
    const request = {
      raw: {
        id: this.lastRequestId++,
        type: RequestType.Common,
        channelName,
        name,
        arg,
      },
    };

    if (this.state === State.Uninitialized) {
      return this.bufferRequest(request);
    }

    return this.doRequest(request);
  }

  private doRequest(request: IRequest): Promise<any> {
    const id = request.raw.id;

    return new Promise<any>((c, e) => {
      this.handlers[id] = response => {
        switch (response.type) {
          case ResponseType.Success:
            delete this.handlers[id];
            c(response.data);
            break;

          case ResponseType.Error:
            delete this.handlers[id];
            const error = new Error(response.data.message);
            (<any>error).stack = response.data.stack;
            error.name = response.data.name;
            e(error);
            break;

          case ResponseType.ErrorObj:
            delete this.handlers[id];
            e(response.data);
            break;

          case ResponseType.Progress:
            // p(response.data);
            break;
        }
      };

      this.send(request.raw);
    });
  }

  private bufferRequest(request: IRequest): Promise<any> {
    let flushedRequest: Promise<any> | null = null;

    return new Promise<any>((c, e) => {
      this.bufferedRequests!.push(request);

      request.flush = () => {
        request.flush = null;
        flushedRequest = this.doRequest(request).then(c, e);
      };
    });
  }

  private onMessage(response: IRawResponse): void {
    if (
      this.state === State.Uninitialized &&
      response.type === ResponseType.Initialize
    ) {
      this.state = State.Idle;
      this.bufferedRequests!.forEach(r => r.flush && r.flush());
      this.bufferedRequests = null;
      return;
    }

    const handler = this.handlers[response.id];
    if (handler) {
      handler(response);
    }
  }

  private send(raw: IRawRequest) {
    try {
      this.protocol.send(raw);
    } catch (err) {
      // noop
    }
  }
}
function bufferIndexOf(buffer: Buffer, value: number, start = 0) {
  while (start < buffer.length && buffer[start] !== value) {
    start++;
  }

  return start;
}

export class Protocol implements IMessagePassingProtocol {
  private static _headerLen = 17;

  private _onMessage = new Emitter<any>();
  readonly onMessage: Event<any> = this._onMessage.event;

  constructor(private _socket: net.Socket) {
    let chunks: Buffer[] = [];
    let totalLength = 0;

    const state = {
      readHead: true,
      bodyIsJson: false,
      bodyLen: -1,
    };

    _socket.on('data', (data: Buffer) => {
      chunks.push(data);
      totalLength += data.length;

      while (totalLength > 0) {
        if (state.readHead) {
          // expecting header -> read 17bytes for header
          // information: `bodyIsJson` and `bodyLen`
          if (totalLength >= Protocol._headerLen) {
            const all = Buffer.concat(chunks);

            state.bodyIsJson = all.readInt8(0) === 1;
            state.bodyLen = all.readInt32BE(1);
            state.readHead = false;

            const rest = all.slice(Protocol._headerLen);
            totalLength = rest.length;
            chunks = [rest];
          } else {
            break;
          }
        }

        if (!state.readHead) {
          // expecting body -> read bodyLen-bytes for
          // the actual message or wait for more data
          if (totalLength >= state.bodyLen) {
            const all = Buffer.concat(chunks);
            let message = all.toString('utf8', 0, state.bodyLen);
            if (state.bodyIsJson) {
              message = JSON.parse(message);
            }
            this._onMessage.fire(message);

            const rest = all.slice(state.bodyLen);
            totalLength = rest.length;
            chunks = [rest];

            state.bodyIsJson = false;
            state.bodyLen = -1;
            state.readHead = true;
          } else {
            break;
          }
        }
      }
    });
  }

  public send(message: any): void {
    // [bodyIsJson|bodyLen|message]
    // |^header^^^^^^^^^^^|^data^^]

    const header = Buffer.alloc(Protocol._headerLen);

    // ensure string
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
      header.writeInt8(1, 0);
    }
    const data = Buffer.from(message);
    header.writeInt32BE(data.length, 1);

    this._writeSoon(header, data);
  }

  private _writeBuffer = new class {
    private _data: Buffer[] = [];
    private _totalLength = 0;

    add(head: Buffer, body: Buffer): boolean {
      const wasEmpty = this._totalLength === 0;
      this._data.push(head, body);
      this._totalLength += head.length + body.length;
      return wasEmpty;
    }

    take(): Buffer {
      const ret = Buffer.concat(this._data, this._totalLength);
      this._data.length = 0;
      this._totalLength = 0;
      return ret;
    }
  }();

  private _writeSoon(header: Buffer, data: Buffer): void {
    if (this._writeBuffer.add(header, data)) {
      setImmediate(() => {
        // return early if socket has been destroyed in the meantime
        if (this._socket.destroyed) {
          return;
        }
        // we ignore the returned value from `write` because we would have to cached the data
        // anyways and nodejs is already doing that for us:
        // > https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
        // > However, the false return value is only advisory and the writable stream will unconditionally
        // > accept and buffer chunk even if it has not not been allowed to drain.
        this._socket.write(this._writeBuffer.take());
      });
    }
  }
}

export class Server implements IServer, IDisposable {
  private channels: { [name: string]: IChannel } | null;
  private server: net.Server | null;

  constructor(server: net.Server) {
    this.channels = Object.create(null);
    this.server = server;
    this.server.on('connection', (socket: net.Socket) => {
      const ipcServer = new IPCServer(new Protocol(socket));

      Object.keys(this.channels).forEach(name =>
        ipcServer.registerChannel(name, this.channels![name])
      );

      socket.once('close', () => ipcServer.dispose());
    });
  }

  registerChannel(channelName: string, channel: IChannel): void {
    this.channels![channelName] = channel;
  }

  dispose(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.channels = null;
  }
}

export class Client implements IClient, IDisposable {
  private ipcClient: IPCClient | null;
  private socket: net.Socket | null;

  constructor(socket: net.Socket) {
    this.ipcClient = new IPCClient(new Protocol(socket));
    this.socket = socket;
  }

  getChannel<T extends IChannel>(channelName: string): T {
    return this.ipcClient!.getChannel(channelName) as T;
  }

  dispose(): void {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    this.ipcClient = null;
  }
}

export function serve(port: number): Promise<Server> {
  return new Promise<Server>((c, e) => {
    const server = net.createServer();

    server.on('error', e);
    server.listen(port, () => {
      server.removeListener('error', e);
      c(new Server(server));
    });
  });
}

export function connect(port: number): Promise<Client> {
  return new Promise<Client>((c, e) => {
    const socket = net.createConnection(port, undefined, () => {
      socket.removeListener('error', e);
      c(new Client(socket));
    });

    socket.once('error', e);
  });
}
