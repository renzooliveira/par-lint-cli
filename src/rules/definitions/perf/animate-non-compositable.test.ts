import { describe, it, expect } from 'vitest';
import { animateNonCompositableRule } from './animate-non-compositable.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('perf/animate-non-compositable', () => {
  it('detects transition/animation on height/width', async () => {
    const file = categorizeFile('violations/perf/animate-non-compositable.component.scss');
    const findings = await animateNonCompositableRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it('does not flag transform/opacity animations', async () => {
    const file = categorizeFile('valid/perf/compositable-animation.component.scss');
    const findings = await animateNonCompositableRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
