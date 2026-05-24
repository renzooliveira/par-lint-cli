import { describe, it, expect } from 'vitest';
import { missingTypeSuffixRule } from './missing-type-suffix.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/missing-type-suffix', () => {
  it('flags ts file without recognized type suffix', async () => {
    const file = categorizeFile('violations/naming/userService.ts');
    const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('naming/missing-type-suffix');
    expect(findings[0]!.message).toContain('type suffix');
  });

  it('passes file with recognized type suffix', async () => {
    const file = categorizeFile('valid/naming/user.service.ts');
    const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('passes component file', async () => {
    const file = categorizeFile('valid/naming/user-list.component.ts');
    const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips index.ts', async () => {
    const file = categorizeFile('some-feature/index.ts');
    const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips main.ts', async () => {
    const file = categorizeFile('src/main.ts');
    const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips spec files', async () => {
    const file = categorizeFile('user.spec.ts');
    const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips non-ts files', async () => {
    const file = categorizeFile('styles.scss');
    const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('passes lib-style suffixes like loader, runner, scanner', async () => {
    for (const name of ['file.loader.ts', 'rule.runner.ts', 'file.scanner.ts', 'data.cache.ts']) {
      const file = categorizeFile(name);
      const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);
      expect(findings, `${name} should pass`).toHaveLength(0);
    }
  });

  it('passes exempt basenames like defaults.ts, types.ts', async () => {
    for (const name of ['defaults.ts', 'types.ts', 'constants.ts', 'utils.ts']) {
      const file = categorizeFile(name);
      const findings = await missingTypeSuffixRule.run(file, config, FIXTURES);
      expect(findings, `${name} should pass`).toHaveLength(0);
    }
  });
});
