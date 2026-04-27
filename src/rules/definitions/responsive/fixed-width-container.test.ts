import { describe, it, expect } from 'vitest';
import { fixedWidthContainerRule } from './fixed-width-container.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('responsive/fixed-width-container', () => {
  it('flags fixed width in px', async () => {
    const file = categorizeFile('violations/responsive/fixed-width.component.scss');
    const findings = await fixedWidthContainerRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('responsive/fixed-width-container');
  });

  it('passes fluid widths', async () => {
    const file = categorizeFile('valid/responsive/fluid-width.component.scss');
    const findings = await fixedWidthContainerRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
