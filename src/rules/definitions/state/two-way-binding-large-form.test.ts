import { describe, it, expect } from 'vitest';
import { twoWayBindingLargeFormRule } from './two-way-binding-large-form.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('state/two-way-binding-on-large-form', () => {
  it('detects form with too many ngModel bindings', async () => {
    const file = categorizeFile('violations/ngmodel-large-form.component.html');
    const findings = await twoWayBindingLargeFormRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('5');
    expect(findings[0]!.rule_id).toBe('state/two-way-binding-on-large-form');
  });

  it('does not flag form with few ngModel bindings', async () => {
    const file = categorizeFile('valid/state/small-form.component.html');
    const findings = await twoWayBindingLargeFormRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
