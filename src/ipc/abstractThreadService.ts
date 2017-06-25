/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* tslint:disable */

import { IManyHandler, IRemoteCom } from './ipcRemoteCom';
import { ProxyIdentifier, IThreadService } from './threadService';

export abstract class AbstractThreadService implements IManyHandler {
  private _isMain: boolean;
  protected _locals: { [id: string]: any };
  private _proxies: { [id: string]: any } = Object.create(null);

  constructor(isMain: boolean) {
    this._isMain = isMain;
    this._locals = Object.create(null);
    this._proxies = Object.create(null);
  }

  public handle(rpcId: string, methodName: string, args: any[]): any {
    if (!this._locals[rpcId]) {
      throw new Error('Unknown actor ' + rpcId);
    }
    let actor = this._locals[rpcId];
    let method = actor[methodName];
    if (typeof method !== 'function') {
      throw new Error('Unknown method ' + methodName + ' on actor ' + rpcId);
    }
    return method.apply(actor, args);
  }

  get<T>(identifier: ProxyIdentifier<T>): T {
    if (!this._proxies[identifier.id]) {
      this._proxies[identifier.id] = this._createProxy(
        identifier.id,
        identifier.methodNames
      );
    }
    return this._proxies[identifier.id];
  }

  private _createProxy<T>(id: string, methodNames: string[]): T {
    let result: any = {};
    for (let i = 0; i < methodNames.length; i++) {
      let methodName = methodNames[i];
      result[methodName] = this.createMethodProxy(id, methodName);
    }
    return result;
  }

  private createMethodProxy(
    id: string,
    methodName: string
  ): (...myArgs: any[]) => Promise<any> {
    return (...myArgs: any[]) => {
      return this._callOnRemote(id, methodName, myArgs);
    };
  }

  set<T>(identifier: ProxyIdentifier<T>, value: T): void {
    if (identifier.isMain !== this._isMain) {
      throw new Error('Mismatch in object registration!');
    }
    this._locals[identifier.id] = value;
  }

  protected abstract _callOnRemote(
    proxyId: string,
    path: string,
    args: any[]
  ): Promise<any>;
}

export class ThreadService extends AbstractThreadService
  implements IThreadService {
  public _serviceBrand: any;
  protected _remoteCom: IRemoteCom;

  constructor(remoteCom: IRemoteCom, isMain: boolean) {
    super(isMain);
    this._remoteCom = remoteCom;
    this._remoteCom.setManyHandler(this);
  }

  protected _callOnRemote(
    proxyId: string,
    path: string,
    args: any[]
  ): Promise<any> {
    return this._remoteCom.callOnRemote(proxyId, path, args);
  }
}
