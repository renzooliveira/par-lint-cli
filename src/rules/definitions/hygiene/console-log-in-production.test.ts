import { describe, it, expect } from 'vitest';
import { consoleLogInProductionRule } from './console-log-in-production.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('hygiene/console-log-in-production', () => {
  it('flags console.log/debug/info in non-spec files', async () => {
    const file = categorizeFile('violations/hygiene/console-log.service.ts');
    const findings = await consoleLogInProductionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('hygiene/console-log-in-production');
  });

  it('passes files with only warn/error', async () => {
    const file = categorizeFile('valid/hygiene/no-console-log.service.ts');
    const findings = await consoleLogInProductionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips CLI command files', async () => {
    const file = categorizeFile('valid/hygiene/cli-command.ts');
    const findings = await consoleLogInProductionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
