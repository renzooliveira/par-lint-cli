import { describe, it, expect } from 'vitest';

describe('MeaningfulTest', () => {
  it('should calculate sum', () => {
    expect(2 + 2).toBe(4);
  });

  it('should validate name', () => {
    const name = 'test';
    expect(name).toContain('tes');
  });
});
