import { describe, it, expect } from 'vitest';

describe('SlowTest', () => {
  it('should wait for data', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    expect(true).toBe(true);
  });

  it('should delay', async () => {
    await new Promise(r => setTimeout(r, 500));
    expect(1).toBe(1);
  });
});
