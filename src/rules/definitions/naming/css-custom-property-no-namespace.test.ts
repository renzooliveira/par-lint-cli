import { describe, it, expect } from 'vitest';
import { cssCustomPropertyNoNamespaceRule } from './css-custom-property-no-namespace.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/css-custom-property-no-namespace', () => {
  it('flags custom properties without namespace prefix', async () => {
    const file = categorizeFile('violations/naming/no-namespace-props.component.scss');
    const findings = await cssCustomPropertyNoNamespaceRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('naming/css-custom-property-no-namespace');
  });

  it('passes namespaced custom properties', async () => {
    const file = categorizeFile('valid/naming/namespaced-props.component.scss');
    const findings = await cssCustomPropertyNoNamespaceRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
