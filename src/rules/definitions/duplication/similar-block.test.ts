import { describe, it, expect } from 'vitest';
import { similarBlockRule } from './similar-block.js';

const rule = similarBlockRule;
const cwd = process.cwd();

describe('duplication/similar-block', () => {
  it('passes when methods are structurally different', async () => {
    const findings = await rule.run(
      { path: 'fixtures/valid/duplication/unique-methods.service.ts', tags: ['is_typescript', 'is_service'] },
      {},
      cwd,
    );
    expect(findings).toHaveLength(0);
  });

  it('flags structurally similar methods in same file', async () => {
    const findings = await rule.run(
      { path: 'fixtures/violations/duplication/similar-methods.service.ts', tags: ['is_typescript', 'is_service'] },
      {},
      cwd,
    );
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]!.message).toContain('similar');
  });

  it('skips test files', async () => {
    const findings = await rule.run(
      { path: 'src/app.spec.ts', tags: ['is_typescript'] },
      {},
      cwd,
    );
    expect(findings).toHaveLength(0);
  });
});
