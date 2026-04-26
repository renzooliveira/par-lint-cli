import { describe, it, expect } from 'vitest';
import { excessiveInputOutputRule } from './excessive-input-output.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/excessive-input-output', () => {
  it('detects excessive inputs and outputs', async () => {
    const file = categorizeFile('violations/excessive-io.component.ts');
    const findings = await excessiveInputOutputRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('component/excessive-input-output');
    expect(findings.some((f) => f.message.includes('inputs'))).toBe(true);
  });

  it('does not flag clean component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await excessiveInputOutputRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
