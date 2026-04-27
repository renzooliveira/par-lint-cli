import { describe, it } from 'vitest';

describe('NoAssertion', () => {
  it('does stuff but never asserts', () => {
    const x = 1 + 1;
    console.log(x);
  });

  it('also no assertion', () => {
    const arr = [1, 2, 3];
    arr.map(v => v * 2);
  });
});
