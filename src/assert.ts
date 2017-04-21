import { isEqual } from 'lodash';

export function assertDefined(value: any, message?: string) {
  if (!value) {
    throw new Error(message ? message : 'should be defined');
  }
}

export function assertTrue(value:any, message?: string) {
  if(value !== true) {
    throw new Error(message ? message : 'should be true');
  }
}

// export function checkToBe(actualValue: any, expetedValue: any, message: string): void {
//   if (actualValue !== expetedValue) {
//     throw new Error(message);
//   }
// }

// export function checkToEqual(actualValue: any, expetedValue: any, message: string): void {
//   if (!isEqual(actualValue, expetedValue)) {
//     console.error('unequal: actualValue:', actualValue, ' expetedValue: ', expetedValue);
//     throw new Error(message);
//   }
// }
