import { describe, it, expect } from 'vitest';

describe('TooManyAssertions', () => {
  it('tests everything at once', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
    expect(obj.a).toBe(1);
    expect(obj.b).toBe(2);
    expect(obj.c).toBe(3);
    expect(obj.d).toBe(4);
    expect(obj.e).toBe(5);
    expect(obj.f).toBe(6);
  });
});
