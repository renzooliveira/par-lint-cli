import { describe, it, expect } from 'vitest';
import { generateHookScript } from './hook.js';

describe('generateHookScript', () => {
  it('contains par-lint review command', () => {
    const script = generateHookScript();
    expect(script).toContain('par-lint');
    expect(script).toContain('review');
  });

  it('contains incremental flag', () => {
    const script = generateHookScript();
    expect(script).toContain('--incremental');
  });

  it('contains shebang', () => {
    const script = generateHookScript();
    expect(script).toMatch(/^#!/);
  });

  it('exits on error findings', () => {
    const script = generateHookScript();
    expect(script).toContain('exit');
  });
});
