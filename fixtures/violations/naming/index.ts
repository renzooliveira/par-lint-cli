export * from './user.service.js';
export * from './user.model.js';

export function helperFunction() {
  return 'this should not be in index';
}

export class InlineClass {
  value = 42;
}
