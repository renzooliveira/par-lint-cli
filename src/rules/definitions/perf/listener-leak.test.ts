import { describe, it, expect } from 'vitest';
import { listenerLeakRule } from './listener-leak.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('perf/listener-leak', () => {
  it('detects addEventListener without cleanup', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/listener-leak.component.ts');
    const findings = await listenerLeakRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('perf/listener-leak');
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag file without addEventListener', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await listenerLeakRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
