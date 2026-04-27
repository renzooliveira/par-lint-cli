import { describe, it, expect } from 'vitest';
import { ionicGridWithoutResponsiveSizesRule } from './ionic-grid-without-responsive-sizes.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('responsive/ionic-grid-without-responsive-sizes', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects ion-col with size but no responsive variants', async () => {
    const file = categorizeFile('violations/responsive/ionic-grid-no-sizes.component.html');
    const findings = await ionicGridWithoutResponsiveSizesRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('responsive/ionic-grid-without-responsive-sizes');
  });

  it('passes when responsive sizes present', async () => {
    const file = categorizeFile('valid/responsive/ionic-grid-responsive.component.html');
    const findings = await ionicGridWithoutResponsiveSizesRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
