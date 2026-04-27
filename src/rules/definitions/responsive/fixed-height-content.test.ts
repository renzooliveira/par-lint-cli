import { describe, it, expect } from 'vitest';
import { fixedHeightContentRule } from './fixed-height-content.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('responsive/fixed-height-content', () => {
  it('flags fixed height in px', async () => {
    const file = categorizeFile('violations/responsive/fixed-height.component.scss');
    const findings = await fixedHeightContentRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('responsive/fixed-height-content');
  });

  it('passes min-height usage', async () => {
    const file = categorizeFile('valid/responsive/min-height.component.scss');
    const findings = await fixedHeightContentRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
