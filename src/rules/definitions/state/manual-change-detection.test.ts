import { describe, it, expect } from 'vitest';
import { manualChangeDetectionRule } from './manual-change-detection.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('state/manual-change-detection', () => {
  it('detects detectChanges and markForCheck', async () => {
    const file = categorizeFile('violations/manual-change-detection.component.ts');
    const findings = await manualChangeDetectionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.some((f) => f.message.includes('detectChanges'))).toBe(true);
    expect(findings.some((f) => f.message.includes('markForCheck'))).toBe(true);
    expect(findings[0]!.rule_id).toBe('state/manual-change-detection');
    expect(findings[0]!.category).toBe('state');
  });

  it('does not flag clean component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await manualChangeDetectionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
