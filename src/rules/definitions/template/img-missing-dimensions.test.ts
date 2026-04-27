import { describe, it, expect } from 'vitest';
import { imgMissingDimensionsRule } from './img-missing-dimensions.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('template/img-missing-dimensions', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects img missing width and/or height', async () => {
    const file = categorizeFile('violations/template/img-missing-dimensions.component.html');
    const findings = await imgMissingDimensionsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(2);
    expect(findings[0]!.message).toContain('width and height');
    expect(findings[1]!.message).toContain('height');
  });

  it('passes when all imgs have both dimensions', async () => {
    const file = categorizeFile('valid/template/clean-images.component.html');
    const findings = await imgMissingDimensionsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
