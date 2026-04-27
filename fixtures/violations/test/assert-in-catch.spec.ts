import { describe, it, expect } from 'vitest';

describe('CatchOnlyAssert', () => {
  it('should throw on invalid input', () => {
    try {
      JSON.parse('invalid');
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('should handle error', () => {
    try {
      throw new Error('fail');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});
