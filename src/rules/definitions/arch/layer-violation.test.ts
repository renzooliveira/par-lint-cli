import { describe, it, expect } from 'vitest';
import { layerViolationRule } from './layer-violation.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/layer-violation', () => {
  it('detects core importing from features', async () => {
    const file = categorizeFile('violations/arch/core/auth.service.ts');
    const findings = await layerViolationRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('arch/layer-violation');
    expect(findings[0]!.message).toContain('core');
    expect(findings[0]!.message).toContain('features');
  });
});
