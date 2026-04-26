import { describe, it, expect } from 'vitest';
import { missingTrackByRule } from './missing-trackby.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/missing-trackby', () => {
  it('detects ngFor without trackBy', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-trackby.component.html');
    const findings = await missingTrackByRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('component/missing-trackby');
    expect(findings[0]!.message).toContain('trackBy');
  });

  it('does not flag clean template', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await missingTrackByRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
