import { describe, it, expect } from 'vitest';
import { tosignalMissingInitialvalueRule } from './tosignal-missing-initialvalue.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('signals/tosignal-missing-initialvalue', () => {
  it('detects toSignal without initialValue', async () => {
    const file = categorizeFile('violations/signals/tosignal-missing-initial.component.ts');
    const findings = await tosignalMissingInitialvalueRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('initialValue');
  });

  it('does not flag toSignal with initialValue', async () => {
    const file = categorizeFile('valid/signals/tosignal-with-initial.component.ts');
    const findings = await tosignalMissingInitialvalueRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
