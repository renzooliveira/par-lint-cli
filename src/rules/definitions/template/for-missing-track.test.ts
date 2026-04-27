import { describe, it, expect } from 'vitest';
import { forMissingTrackRule } from './for-missing-track.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('template/for-missing-track', () => {
  it('detects @for without track', async () => {
    const file = categorizeFile('violations/template/for-missing-track.component.html');
    const findings = await forMissingTrackRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.rule_id).toBe('template/for-missing-track');
    expect(findings[0]!.message).toContain('track');
  });

  it('does not flag @for with track', async () => {
    const file = categorizeFile('valid/template/modern-control-flow.component.html');
    const findings = await forMissingTrackRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
