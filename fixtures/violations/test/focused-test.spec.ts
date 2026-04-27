import { fdescribe, fit, describe, it, expect } from 'vitest';

fdescribe('FocusedSuite', () => {
  fit('should run only this', () => {
    expect(true).toBe(true);
  });
});
