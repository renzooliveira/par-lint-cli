import { describe, it, expect } from 'vitest';
import { subscribeWithoutCleanupRule } from './subscribe-without-cleanup.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('state/subscribe-without-cleanup', () => {
  it('detects subscriptions without cleanup in component', async () => {
    const file = categorizeFile('violations/subscribe-without-cleanup.component.ts');
    const findings = await subscribeWithoutCleanupRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('state/subscribe-without-cleanup');
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag component with takeUntilDestroyed', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await subscribeWithoutCleanupRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
