import { describe, it, expect } from 'vitest';
import { debuggerStatementRule } from './debugger-statement.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('hygiene/debugger-statement', () => {
  it('flags debugger statements', async () => {
    const file = categorizeFile('violations/hygiene/debugger-statement.service.ts');
    const findings = await debuggerStatementRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('hygiene/debugger-statement');
  });

  it('passes clean files', async () => {
    const file = categorizeFile('valid/hygiene/no-console-log.service.ts');
    const findings = await debuggerStatementRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
