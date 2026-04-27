import { describe, it, expect } from 'vitest';
import { eventWithoutKeyboardRule } from './event-without-keyboard.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('template/event-without-keyboard', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects non-interactive elements with click but no keyboard', async () => {
    const file = categorizeFile('violations/template/event-without-keyboard.component.html');
    const findings = await eventWithoutKeyboardRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(2);
    expect(findings[0]!.message).toContain('div');
    expect(findings[1]!.message).toContain('span');
  });

  it('passes when keyboard handler present or element is interactive', async () => {
    const file = categorizeFile('valid/template/clean-events.component.html');
    const findings = await eventWithoutKeyboardRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
