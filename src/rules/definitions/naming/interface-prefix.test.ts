import { describe, it, expect } from 'vitest';
import { interfacePrefixRule } from './interface-prefix.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/interface-prefix', () => {
  it('flags interfaces with I prefix', async () => {
    const file = categorizeFile('violations/naming/prefixed-interface.service.ts');
    const findings = await interfacePrefixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(2);
    expect(findings[0]!.rule_id).toBe('naming/interface-prefix');
    expect(findings[0]!.message).toContain('IUserService');
    expect(findings[1]!.message).toContain('IAuthProvider');
  });

  it('passes interfaces without I prefix', async () => {
    const file = categorizeFile('valid/naming/no-prefix-interface.service.ts');
    const findings = await interfacePrefixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips non-ts files', async () => {
    const file = categorizeFile('styles.scss');
    const findings = await interfacePrefixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
