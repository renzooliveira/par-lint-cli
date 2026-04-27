import { describe, it, expect } from 'vitest';
import { eventListenerWithoutDisposeRule } from './event-listener-without-dispose.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('perf/event-listener-without-dispose', () => {
  it('detects addEventListener without remove', async () => {
    const file = categorizeFile('violations/perf/event-listener-no-dispose.component.ts');
    const findings = await eventListenerWithoutDisposeRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
  });

  it('does not flag with removeEventListener', async () => {
    const file = categorizeFile('valid/perf/event-listener-with-dispose.component.ts');
    const findings = await eventListenerWithoutDisposeRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
