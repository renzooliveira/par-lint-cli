import { describe, it, expect } from 'vitest';

describe('AlwaysTrueTest', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });

  it('should also work', () => {
    expect(1).toBeTruthy();
    expect(true).toEqual(true);
  });
});
