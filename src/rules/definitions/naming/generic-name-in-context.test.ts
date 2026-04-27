import { describe, it, expect } from 'vitest';
import { genericNameInContextRule } from './generic-name-in-context.js';

const rule = genericNameInContextRule;
const cwd = process.cwd();

describe('naming/generic-name-in-context', () => {
  it('passes when class name includes feature context', async () => {
    const findings = await rule.run(
      { path: 'fixtures/valid/naming/features/user-form/models/context-specific-name.model.ts', tags: ['is_typescript', 'is_model'] },
      {},
      cwd,
    );
    expect(findings).toHaveLength(0);
  });

  it('flags generic class name inside feature directory', async () => {
    const findings = await rule.run(
      { path: 'fixtures/violations/naming/features/user-form/models/generic-name-in-feature.model.ts', tags: ['is_typescript', 'is_model'] },
      {},
      cwd,
    );
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]!.message).toContain('Attachment');
    expect(findings[0]!.message).toContain('UserForm');
  });

  it('skips files in shared/ directory', async () => {
    const findings = await rule.run(
      { path: 'src/shared/models/attachment.model.ts', tags: ['is_typescript', 'is_model'] },
      {},
      cwd,
    );
    expect(findings).toHaveLength(0);
  });

  it('skips files outside feature directories', async () => {
    const findings = await rule.run(
      { path: 'src/models/attachment.model.ts', tags: ['is_typescript', 'is_model'] },
      {},
      cwd,
    );
    expect(findings).toHaveLength(0);
  });

  it('skips test files', async () => {
    const findings = await rule.run(
      { path: 'src/features/billing/models/item.model.spec.ts', tags: ['is_typescript'] },
      {},
      cwd,
    );
    expect(findings).toHaveLength(0);
  });
});
