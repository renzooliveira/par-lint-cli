import { describe, it, expect } from 'vitest';
import { heavyComputationInRenderRule } from './heavy-computation-in-render.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('perf/heavy-computation-in-render', () => {
  it('flags function calls with arguments as warning', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/heavy-computation.component.html');
    const findings = await heavyComputationInRenderRule.run(file, config, FIXTURES);

    const withArgs = findings.filter((f) => f.severity === 'warning');
    expect(withArgs.length).toBeGreaterThanOrEqual(1);
    expect(withArgs.some((f) => f.message.includes('formatDate'))).toBe(true);
  });

  it('skips signal-style property access like signal().prop', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/heavy-computation.component.html');
    const findings = await heavyComputationInRenderRule.run(file, config, FIXTURES);

    const signalAccess = findings.filter((f) => f.message.includes('props().name'));
    expect(signalAccess).toHaveLength(0);
  });

  it('skips bare signal getter calls like signal()', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/heavy-computation.component.html');
    const findings = await heavyComputationInRenderRule.run(file, config, FIXTURES);

    const bareSignal = findings.filter((f) => f.message.includes('mySignal()'));
    expect(bareSignal).toHaveLength(0);
  });

  it('does not flag clean template', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await heavyComputationInRenderRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
