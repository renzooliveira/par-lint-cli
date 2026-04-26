import { describe, it, expect } from 'vitest';
import { circularDependencyRule } from './circular-dependency.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/circular-dependency', () => {
  it('is a valid rule definition', () => {
    expect(circularDependencyRule.id).toBe('arch/circular-dependency');
    expect(circularDependencyRule.category).toBe('arch');
    expect(circularDependencyRule.severity).toBe('error');
  });

  it('does not flag files without circular imports', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await circularDependencyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
