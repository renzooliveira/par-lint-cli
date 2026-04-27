import { describe, it, expect } from 'vitest';
import { missingErrorHandlerRule } from './missing-error-handler.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('rxjs/missing-error-handler', () => {
  it('flags .subscribe() without error handler or catchError', async () => {
    const file = categorizeFile('violations/rxjs/missing-error-handler.service.ts');
    const findings = await missingErrorHandlerRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('rxjs/missing-error-handler');
  });

  it('passes subscribe with catchError upstream', async () => {
    const file = categorizeFile('valid/rxjs/with-error-handler.service.ts');
    const findings = await missingErrorHandlerRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
