import { describe, it, expect } from 'vitest';
import { parseSuppressions, applySuppressions } from './suppression.js';
import { createFinding } from './finding.js';
import type { ParLintConfig } from '../types/config.js';
import path from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';

describe('parseSuppressions', () => {
  it('parses disable-next-line with reason', () => {
    const source = `// par-lint-disable-next-line state/manual-change-detection -- legacy code, scheduled for refactor
cdr.detectChanges();`;

    const directives = parseSuppressions(source);
    expect(directives).toHaveLength(1);
    expect(directives[0]!.ruleIds).toEqual(['state/manual-change-detection']);
    expect(directives[0]!.reason).toBe('legacy code, scheduled for refactor');
    expect(directives[0]!.scope).toBe('line');
    expect(directives[0]!.line).toBe(2);
  });

  it('parses disable-file directive', () => {
    const source = `// par-lint-disable-file a11y/missing-alt -- generated template
<img src="x.png">`;

    const directives = parseSuppressions(source);
    expect(directives).toHaveLength(1);
    expect(directives[0]!.scope).toBe('file');
    expect(directives[0]!.ruleIds).toEqual(['a11y/missing-alt']);
  });

  it('parses multiple rule ids', () => {
    const source = `// par-lint-disable-next-line scss/hardcoded-color,scss/hardcoded-spacing -- design tokens not available yet`;

    const directives = parseSuppressions(source);
    expect(directives[0]!.ruleIds).toEqual(['scss/hardcoded-color', 'scss/hardcoded-spacing']);
  });
});

describe('applySuppressions', () => {
  const tmpDir = path.resolve(import.meta.dirname, '../../.tmp-test-suppression');

  const config: ParLintConfig = {
    schema_version: '1.0',
    project: { name: 'test', stack: 'angular' },
    realizations: {},
    layers: [],
    layer_rules: [],
    rules: {},
    suppression: { require_reason: true, min_reason_length: 20, reviewable: true },
    output: { formats: ['json'], json_path: '', sarif_path: '', markdown_path: '', state_path: '' },
    performance: { cache_enabled: true, parallel_workers: 4, incremental: 'auto' },
    custom_rules: [],
  };

  it('suppresses finding when directive matches and reason is long enough', async () => {
    await mkdir(tmpDir, { recursive: true });
    await writeFile(
      path.join(tmpDir, 'test.ts'),
      `// par-lint-disable-next-line state/test-rule -- this is a long enough reason for suppression
const x = 1;`,
    );

    const finding = createFinding({
      rule_id: 'state/test-rule',
      file: 'test.ts',
      line: 2,
      severity: 'warning',
      message: 'test',
      source_principle: 'test',
      category: 'state',
    });

    const result = await applySuppressions([finding], config, tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0]!.suppression).toBeDefined();
    expect(result[0]!.suppression!.source).toBe('inline_comment');

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('does not suppress when reason is too short', async () => {
    await mkdir(tmpDir, { recursive: true });
    await writeFile(
      path.join(tmpDir, 'test.ts'),
      `// par-lint-disable-next-line state/test-rule -- short
const x = 1;`,
    );

    const finding = createFinding({
      rule_id: 'state/test-rule',
      file: 'test.ts',
      line: 2,
      severity: 'warning',
      message: 'test',
      source_principle: 'test',
      category: 'state',
    });

    const result = await applySuppressions([finding], config, tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0]!.suppression).toBeUndefined();

    await rm(tmpDir, { recursive: true, force: true });
  });
});
