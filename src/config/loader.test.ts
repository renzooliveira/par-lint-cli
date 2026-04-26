import { describe, it, expect } from 'vitest';
import { parLintConfigSchema } from './schema.js';

describe('parLintConfigSchema', () => {
  it('parses minimal config with defaults', () => {
    const input = {
      project: { name: 'test-project' },
    };
    const result = parLintConfigSchema.parse(input);

    expect(result.project.name).toBe('test-project');
    expect(result.project.stack).toBe('angular');
    expect(result.schema_version).toBe('1.0');
    expect(result.suppression.require_reason).toBe(true);
    expect(result.suppression.min_reason_length).toBe(20);
    expect(result.output.formats).toEqual(['json']);
    expect(result.performance.cache_enabled).toBe(true);
    expect(result.performance.parallel_workers).toBe(4);
  });

  it('parses full config', () => {
    const input = {
      schema_version: '1.0',
      project: { name: 'par-scheduling', stack: 'angular-ionic' },
      realizations: {
        preconditions: { style: 'fluent_validation' },
      },
      layers: [
        { name: 'domain', pattern: 'src/domain/**' },
      ],
      layer_rules: [
        { from: 'domain', cannot_import_from: ['infrastructure'] },
      ],
      rules: {
        'arch/god-file': { enabled: true, severity: 'warning', threshold_loc: 200 },
      },
      suppression: {
        require_reason: true,
        min_reason_length: 30,
        reviewable: false,
      },
      output: {
        formats: ['json', 'sarif'],
        json_path: '.par-lint/findings.json',
        sarif_path: '.par-lint/findings.sarif',
        markdown_path: '.par-lint/report.md',
        state_path: '.par-lint/state.json',
      },
      performance: {
        cache_enabled: false,
        parallel_workers: 8,
        incremental: 'always',
      },
    };
    const result = parLintConfigSchema.parse(input);

    expect(result.project.stack).toBe('angular-ionic');
    expect(result.realizations['preconditions']?.['style']).toBe('fluent_validation');
    expect(result.layers).toHaveLength(1);
    expect(result.rules['arch/god-file']?.['threshold_loc']).toBe(200);
    expect(result.suppression.min_reason_length).toBe(30);
    expect(result.performance.parallel_workers).toBe(8);
  });

  it('rejects invalid stack', () => {
    const input = {
      project: { name: 'test', stack: 'svelte' },
    };
    expect(() => parLintConfigSchema.parse(input)).toThrow();
  });
});
