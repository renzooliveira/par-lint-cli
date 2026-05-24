import { describe, it, expect } from 'vitest';
import { generateClaudeMdSection } from './init-claude-md.js';
import type { RuleDefinition } from '../../engine/runner.js';
import type { ParLintConfig } from '../../types/config.js';

function makeRule(overrides: Partial<RuleDefinition> & Pick<RuleDefinition, 'id' | 'category' | 'severity'>): RuleDefinition {
  return {
    version: '1.0.0',
    applicable_to: ['is_typescript'],
    description: undefined,
    principle: undefined,
    run: async () => [],
    ...overrides,
  };
}

function makeConfig(rules: Record<string, { enabled: boolean }> = {}): ParLintConfig {
  return {
    schema_version: '1.0',
    project: { name: 'test', stack: 'angular' },
    realizations: {},
    layers: [],
    layer_rules: [],
    rules: rules as ParLintConfig['rules'],
    suppression: { require_reason: true, min_reason_length: 20, reviewable: true },
    output: { formats: ['json'], json_path: '', sarif_path: '', markdown_path: '', state_path: '' },
    performance: { cache_enabled: true, parallel_workers: 4, incremental: 'auto' },
    custom_rules: [],
  };
}

describe('generateClaudeMdSection', () => {
  it('generates markdown table with active rules', () => {
    const rules = [
      makeRule({
        id: 'rxjs/nested-subscribe',
        category: 'rxjs',
        severity: 'error',
        description: 'Detects nested subscribes',
      }),
      makeRule({
        id: 'hygiene/console-log',
        category: 'hygiene',
        severity: 'warning',
        description: 'Detects console.log',
      }),
    ];

    const output = generateClaudeMdSection(rules, makeConfig());

    expect(output).toContain('## par-lint — Active Rules');
    expect(output).toContain('| Rule | Severity | Description |');
    expect(output).toContain('| rxjs/nested-subscribe | error | Detects nested subscribes |');
    expect(output).toContain('| hygiene/console-log | warning | Detects console.log |');
  });

  it('excludes disabled rules', () => {
    const rules = [
      makeRule({ id: 'rxjs/nested-subscribe', category: 'rxjs', severity: 'error', description: 'Nested' }),
      makeRule({ id: 'hygiene/console-log', category: 'hygiene', severity: 'warning', description: 'Console' }),
    ];

    const config = makeConfig({ 'hygiene/console-log': { enabled: false } });
    const output = generateClaudeMdSection(rules, config);

    expect(output).toContain('rxjs/nested-subscribe');
    expect(output).not.toContain('hygiene/console-log');
  });

  it('includes principles section when rules have principles', () => {
    const rules = [
      makeRule({
        id: 'rxjs/nested-subscribe',
        category: 'rxjs',
        severity: 'error',
        principle: 'Use higher-order operators instead of nested subscribes',
      }),
    ];

    const output = generateClaudeMdSection(rules, makeConfig());

    expect(output).toContain('### Principles');
    expect(output).toContain('**rxjs/nested-subscribe**');
    expect(output).toContain('Use higher-order operators instead of nested subscribes');
  });

  it('omits principles section when no rules have principles', () => {
    const rules = [
      makeRule({ id: 'test/rule', category: 'test', severity: 'info' }),
    ];

    const output = generateClaudeMdSection(rules, makeConfig());

    expect(output).not.toContain('### Principles');
  });

  it('handles empty rules list', () => {
    const output = generateClaudeMdSection([], makeConfig());

    expect(output).toContain('## par-lint — Active Rules');
    expect(output).toContain('No active rules');
  });

  it('uses rule id as fallback when description is missing', () => {
    const rules = [
      makeRule({ id: 'test/some-rule', category: 'test', severity: 'info' }),
    ];

    const output = generateClaudeMdSection(rules, makeConfig());

    expect(output).toContain('| test/some-rule | info | test/some-rule |');
  });
});
