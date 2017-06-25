/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
('use strict');

import * as marshalling from './marshalling';
import { IMessagePassingProtocol } from './ipc';

export function transformErrorForSerialization(error: any): any {
  if (error instanceof Error) {
    let { name, message } = error;
    let stack: string = (<any>error).stacktrace || (<any>error).stack;
    return {
      $isError: true,
      name,
      message,
      stack
    };
  }
  return error;
}

interface IRPCFunc {
  (rpcId: string, method: string, args: any[]): Promise<any>;
}

let lastMessageId = 0;
const pendingRPCReplies: { [msgId: string]: LazyPromise<any> } = {};

class MessageFactory {
  public static cancel(req: string): string {
    return `{"cancel":"${req}"}`;
  }

  public static request(
    req: string,
    rpcId: string,
    method: string,
    args: any[]
  ): string {
    return `{"req":"${req}","rpcId":"${rpcId}","method":"${method}","args":${marshalling.stringify(
      args
    )}}`;
  }

  public static replyOK(req: string, res: any): string {
    if (typeof res === 'undefined') {
      return `{"seq":"${req}"}`;
    }
    return `{"seq":"${req}","res":${marshalling.stringify(res)}}`;
  }

  public static replyErr(req: string, err: any): string {
    if (typeof err === 'undefined') {
      return `{"seq":"${req}","err":null}`;
    }
    return `{"seq":"${req}","err":${marshalling.stringify(
      transformErrorForSerialization(err)
    )}}`;
  }
}

type ValueCallback<T, TResult1> = (
  value: T
) => TResult1 | PromiseLike<TResult1>;
type ErrorCallback<TResult2> = (
  reason: any
) => TResult2 | PromiseLike<TResult2>;
class LazyPromise<T> implements Promise<T> {
  readonly [Symbol.toStringTag]: 'Promise';

  private _onCancel: () => void;

  private _actual: Promise<any> | null;
  private _actualOk: ValueCallback<any, any> | null;
  private _actualErr: ErrorCallback<any> | null;

  private _hasValue: boolean;
  private _value: any;

  private _hasErr: boolean;
  private _err: any;

  constructor(onCancel: () => void) {
    this._actual = null;
    this._actualOk = null;
    this._actualErr = null;
    this._hasValue = false;
    this._value = null;
    this._hasErr = false;
    this._err = null;
  }

  private _ensureActual(): Promise<any> {
    if (!this._actual) {
      this._actual = new Promise<any>((c, e) => {
        this._actualOk = c;
        this._actualErr = e;
      });

      if (this._hasValue) {
        this._actualOk!(this._value);
      }

      if (this._hasErr) {
        this._actualErr!(this._err);
      }
    }
    return this._actual;
  }

  public resolveOk(value: any): void {
    if (this._hasErr) {
      return;
    }

    this._hasValue = true;
    this._value = value;

    if (this._actual) {
      this._actualOk!(value);
    }
  }

  public resolveErr(err: any): void {
    if (this._hasValue) {
      return;
    }

    this._hasErr = true;
    this._err = err;

    if (this._actual) {
      this._actualErr!(err);
    }
  }

  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    return this._ensureActual().then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult> {
    return this._ensureActual().catch(onrejected);
  }
}

function createRPC(serializeAndSend: (value: string) => void): IRPCFunc {
  return function rpc(
    rpcId: string,
    method: string,
    args: any[]
  ): Promise<any> {
    let req = String(++lastMessageId);
    let result = new LazyPromise<any>(() => {
      serializeAndSend(MessageFactory.cancel(req));
    });

    pendingRPCReplies[req] = result;

    serializeAndSend(MessageFactory.request(req, rpcId, method, args));

    return result;
  };
}

export interface IManyHandler {
  handle(rpcId: string, method: string, args: any[]): any;
}

export interface IRemoteCom {
  callOnRemote(proxyId: string, path: string, args: any[]): Promise<any>;
  setManyHandler(handler: IManyHandler): void;
}

export function createProxyProtocol(
  protocol: IMessagePassingProtocol
): IRemoteCom {
  let rpc = createRPC(sendDelayed);
  let bigHandler: IManyHandler | null = null;
  let invokedHandlers: { [req: string]: Promise<any> } = Object.create(null);
  let messagesToSend: string[] = [];

  let messagesToReceive: string[] = [];
  let receiveOneMessage = () => {
    let rawmsg = <string>messagesToReceive.shift();

    if (messagesToReceive.length > 0) {
      process.nextTick(receiveOneMessage);
    }

    let msg = marshalling.parse(rawmsg);

    if (msg.seq) {
      if (!pendingRPCReplies.hasOwnProperty(msg.seq)) {
        console.warn('Got reply to unknown seq');
        return;
      }
      let reply = pendingRPCReplies[msg.seq];
      delete pendingRPCReplies[msg.seq];

      if (msg.err) {
        let err = msg.err;
        if (msg.err.$isError) {
          err = new Error();
          err.name = msg.err.name;
          err.message = msg.err.message;
          err.stack = msg.err.stack;
        }
        reply.resolveErr(err);
        return;
      }

      reply.resolveOk(msg.res);
      return;
    }

    // CANCEL
    if (msg.cancel) {
      // if (invokedHandlers[msg.cancel]) {
      // 	invokedHandlers[msg.cancel].cancel();
      // }
      return;
    }

    if (msg.err) {
      console.error(msg.err);
      return;
    }

    let rpcId = msg.rpcId;

    if (!bigHandler) {
      throw new Error('got message before big handler attached!');
    }

    let req = msg.req;

    invokedHandlers[req] = invokeHandler(rpcId, msg.method, msg.args);

    invokedHandlers[req].then(
      r => {
        delete invokedHandlers[req];
        sendDelayed(MessageFactory.replyOK(req, r));
      },
      err => {
        delete invokedHandlers[req];
        sendDelayed(MessageFactory.replyErr(req, err));
      }
    );
  };

  protocol.onMessage(data => {
    // console.log('RECEIVED ' + rawmsg.length + ' MESSAGES.');
    if (messagesToReceive.length === 0) {
      process.nextTick(receiveOneMessage);
    }

    messagesToReceive = messagesToReceive.concat(data);
  });

  let r: IRemoteCom = {
    callOnRemote: rpc,
    setManyHandler: (_bigHandler: IManyHandler): void => {
      bigHandler = _bigHandler;
    }
  };

  function sendAccumulated(): void {
    let tmp = messagesToSend;
    messagesToSend = [];

    // console.log('SENDING ' + tmp.length + ' MESSAGES.');
    protocol.send(tmp);
  }

  function sendDelayed(value: string): void {
    if (messagesToSend.length === 0) {
      process.nextTick(sendAccumulated);
    }
    messagesToSend.push(value);
  }

  function invokeHandler(
    rpcId: string,
    method: string,
    args: any[]
  ): Promise<any> {
    try {
      return Promise.resolve(bigHandler!.handle(rpcId, method, args));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  return r;
}
