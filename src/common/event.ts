/* tslint:disable */
import { IDisposable } from './lifecycle';
import CallbackList from './callbackList';

export interface Event<T> {
  (listener: (
    e: T
  ) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}

export interface EmitterOptions {
  onFirstListenerAdd?: Function;
  onFirstListenerDidAdd?: Function;
  onListenerDidAdd?: Function;
  onLastListenerRemove?: Function;
}

export class Emitter<T> {
  private static _noop = function() {};

  private _event: Event<T>;
  private _callbacks: CallbackList;
  private _disposed: boolean;

  constructor(private _options?: EmitterOptions) {}

  /**
	 * For the public to allow to subscribe
	 * to events from this Emitter
	 */
  get event(): Event<T> {
    if (!this._event) {
      this._event = (
        listener: (e: T) => any,
        thisArgs?: any,
        disposables?: IDisposable[]
      ) => {
        if (!this._callbacks) {
          this._callbacks = new CallbackList();
        }

        const firstListener = this._callbacks.isEmpty();

        if (
          firstListener &&
          this._options &&
          this._options.onFirstListenerAdd
        ) {
          this._options.onFirstListenerAdd(this);
        }

        this._callbacks.add(listener, thisArgs);

        if (
          firstListener &&
          this._options &&
          this._options.onFirstListenerDidAdd
        ) {
          this._options.onFirstListenerDidAdd(this);
        }

        if (this._options && this._options.onListenerDidAdd) {
          this._options.onListenerDidAdd(this, listener, thisArgs);
        }

        let result: IDisposable;
        result = {
          dispose: () => {
            result.dispose = Emitter._noop;
            if (!this._disposed) {
              this._callbacks.remove(listener, thisArgs);
              if (
                this._options &&
                this._options.onLastListenerRemove &&
                this._callbacks.isEmpty()
              ) {
                this._options.onLastListenerRemove(this);
              }
            }
          },
        };
        if (Array.isArray(disposables)) {
          disposables.push(result);
        }

        return result;
      };
    }
    return this._event;
  }

  /**
	 * To be kept private to fire an event to
	 * subscribers
	 */
  fire(event?: T): any {
    if (this._callbacks) {
      this._callbacks.invoke.call(this._callbacks, event);
    }
  }
}
