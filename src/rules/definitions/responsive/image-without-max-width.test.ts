import { describe, it, expect } from 'vitest';
import { imageWithoutMaxWidthRule } from './image-without-max-width.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('responsive/image-without-max-width', () => {
  it('flags img rules without max-width', async () => {
    const file = categorizeFile('violations/responsive/img-no-max-width.component.scss');
    const findings = await imageWithoutMaxWidthRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('responsive/image-without-max-width');
  });

  it('passes img rules with max-width: 100%', async () => {
    const file = categorizeFile('valid/responsive/img-max-width.component.scss');
    const findings = await imageWithoutMaxWidthRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
