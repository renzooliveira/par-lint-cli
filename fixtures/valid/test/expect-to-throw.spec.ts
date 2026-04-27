import { describe, it, expect } from 'vitest';

describe('ProperThrowTest', () => {
  it('should throw on invalid input', () => {
    expect(() => JSON.parse('invalid')).toThrow();
  });
});
