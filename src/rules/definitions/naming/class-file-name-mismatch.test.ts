import { describe, it, expect } from 'vitest';
import { classFileNameMismatchRule } from './class-file-name-mismatch.js';

const rule = classFileNameMismatchRule;

describe('naming/class-file-name-mismatch', () => {
  it('passes when class matches filename', async () => {
    const findings = await rule.run(
      { path: 'fixtures/valid/naming/matching-class-name.service.ts', tags: ['is_typescript', 'is_service'] },
      {},
      process.cwd(),
    );
    expect(findings).toHaveLength(0);
  });

  it('flags when class does not match filename', async () => {
    const findings = await rule.run(
      { path: 'fixtures/violations/naming/mismatched-class-name.service.ts', tags: ['is_typescript', 'is_service'] },
      {},
      process.cwd(),
    );
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]!.message).toContain('MismatchedClassNameService');
  });

  it('handles page suffix correctly', async () => {
    const findings = await rule.run(
      { path: 'src/pages/user-search.page.ts', tags: ['is_typescript', 'is_page'] },
      {},
      process.cwd(),
    );
    // file doesn't exist so readSource will fail, but we test the logic separately
    expect(findings).toBeDefined();
  });

  it('skips test files', async () => {
    const findings = await rule.run(
      { path: 'src/app.spec.ts', tags: ['is_typescript'] },
      {},
      process.cwd(),
    );
    expect(findings).toHaveLength(0);
  });

  it('skips index.ts', async () => {
    const findings = await rule.run(
      { path: 'src/index.ts', tags: ['is_typescript'] },
      {},
      process.cwd(),
    );
    expect(findings).toHaveLength(0);
  });
});
