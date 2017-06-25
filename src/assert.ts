import { isEqual } from 'lodash';

export function assertDefined(value: any, message?: string) {
  if (!value) {
    throw new Error(message ? message : 'should be defined');
  }
}

export function assertTrue(value: any, message?: string) {
  if (value !== true) {
    throw new Error(message ? message : 'should be true');
  }
}
