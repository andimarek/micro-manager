/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* tslint:disable */

export interface IThreadService {
  _serviceBrand: any;

  /**
	 * Always returns a proxy.
	 */
  get<T>(identifier: ProxyIdentifier<T>): T;

  /**
	 * Register instance.
	 */
  set<T>(identifier: ProxyIdentifier<T>, value: T): void;
}

export class ProxyIdentifier<T> {
  _proxyIdentifierBrand: void;

  isMain: boolean;
  id: string;
  methodNames: string[];

  constructor(isMain: boolean, id: string, ctor: Function) {
    this.isMain = isMain;
    this.id = id;
    this.methodNames = [];
    for (let prop of Object.getOwnPropertyNames(ctor.prototype)) {
      if (typeof ctor.prototype[prop] === 'function') {
        this.methodNames.push(prop);
      }
    }
  }
}

export function createMainContextProxyIdentifier<T>(
  identifier: string,
  ctor: Function
): ProxyIdentifier<T> {
  return new ProxyIdentifier(true, 'm' + identifier, ctor);
}

export function createTaskHostContextProxyIdentifier<T>(
  identifier: string,
  ctor: Function
): ProxyIdentifier<T> {
  return new ProxyIdentifier(false, 'e' + identifier, ctor);
}
