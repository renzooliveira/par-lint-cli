import { describe, it, expect } from 'vitest';
import { deeplyNestedConditionalsRule } from './deeply-nested-conditionals.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('template/deeply-nested-conditionals', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects 3+ levels of nested control flow', async () => {
    const file = categorizeFile('violations/template/deeply-nested.component.html');
    const findings = await deeplyNestedConditionalsRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('template/deeply-nested-conditionals');
    expect(findings[0]!.message).toContain('nested control flow');
  });

  it('passes for shallow nesting', async () => {
    const file = categorizeFile('valid/template/shallow-nesting.component.html');
    const findings = await deeplyNestedConditionalsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
