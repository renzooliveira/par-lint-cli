import { describe, it, expect } from 'vitest';
import { ngoninitForDataLoadingRule } from './ngoninit-for-data-loading.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/ngoninit-for-data-loading', () => {
  it('detects ngOnInit with data loading in Ionic page', async () => {
    const file = categorizeFile('violations/ionic/ngoninit-data-loading.page.ts');
    const findings = await ngoninitForDataLoadingRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('ionViewWillEnter');
  });

  it('does not flag ionViewWillEnter usage', async () => {
    const file = categorizeFile('valid/ionic/ionviewwillenter-loading.page.ts');
    const findings = await ngoninitForDataLoadingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
