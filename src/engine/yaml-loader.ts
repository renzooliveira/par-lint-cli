import type { RuleDefinition } from './runner.js';
import type { Finding } from '../types/finding.js';
import type { CategorizedFile } from '../discovery/categorizer.js';
import type { ParLintConfig } from '../types/config.js';
import { createFinding } from './finding.js';
import { readSource, findPattern } from '../adapters/ast-grep.js';
import { analyzeSource } from '../adapters/ts-metrics.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

export interface YamlRegexConfig {
  pattern: string;
  capture_group?: number;
  multiline?: boolean;
}

export interface YamlMetricConfig {
  measure: 'line_count' | 'function_count' | 'cyclomatic_complexity' | 'parameter_count' | 'export_count';
  scope: 'file' | 'function' | 'class' | 'method';
  threshold: number;
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
}

export interface YamlAstGrepConfig {
  pattern: string;
  language?: 'typescript' | 'html' | 'css';
}

export interface YamlRule {
  id: string;
  version: string;
  category: string;
  severity: 'info' | 'warning' | 'error';
  description?: string;
  principle?: string;
  applicable_to: string[];
  exclude_patterns?: string[];
  mode: 'regex' | 'metric' | 'ast-grep';
  regex?: YamlRegexConfig;
  metric?: YamlMetricConfig;
  ast_grep?: YamlAstGrepConfig;
  message_template: string;
  fix_complexity: string;
}

export interface YamlRuleDocument {
  rule: YamlRule;
}

function matchesExclude(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    const globToRegex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    if (new RegExp(globToRegex + '$').test(filePath)) return true;
  }
  return false;
}

function interpolateMessage(template: string, match: RegExpExecArray): string {
  return template.replace(/\{match\[(\d+)\]\}/g, (_, index) => {
    return match[parseInt(index, 10)] ?? '';
  });
}

function compileRegexRule(rule: YamlRule): RuleDefinition {
  if (!rule.regex) {
    throw new Error(`YAML rule "${rule.id}": mode "regex" requires a "regex" block`);
  }

  const flags = rule.regex.multiline ? 'gm' : 'g';
  const re = new RegExp(rule.regex.pattern, flags);

  return {
    id: rule.id,
    version: rule.version,
    category: rule.category,
    severity: rule.severity,
    description: rule.description,
    principle: rule.principle,
    applicable_to: rule.applicable_to,

    async run(
      file: CategorizedFile,
      _config: ParLintConfig,
      cwd: string,
    ): Promise<Finding[]> {
      if (rule.exclude_patterns?.length && matchesExclude(file.path, rule.exclude_patterns)) {
        return [];
      }

      const source = await readSource(file.path, cwd);
      const lines = source.split('\n');
      const findings: Finding[] = [];

      for (let i = 0; i < lines.length; i++) {
        re.lastIndex = 0;
        const match = re.exec(lines[i]!);
        if (!match) continue;

        findings.push(createFinding({
          rule_id: rule.id,
          file: file.path,
          line: i + 1,
          severity: rule.severity,
          message: interpolateMessage(rule.message_template, match),
          source_principle: rule.principle ?? '',
          category: rule.category,
          fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L') ?? 'S',
          evidence_trail: [{
            tool: 'yaml-regex',
            query: { pattern: rule.regex!.pattern, file: file.path },
            result: { line: i + 1, match: match[0] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }

      return findings;
    },
  };
}

const OPERATORS: Record<string, (a: number, b: number) => boolean> = {
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
};

const MEASURE_MAP: Record<string, (metrics: ReturnType<typeof analyzeSource>) => number> = {
  line_count: (m) => m.lineCount,
  function_count: (m) => m.functionCount,
  cyclomatic_complexity: (m) => m.maxCyclomaticComplexity,
  parameter_count: (m) => m.parameterCountMax,
  export_count: (m) => m.exportCount,
};

function compileMetricRule(rule: YamlRule): RuleDefinition {
  if (!rule.metric) {
    throw new Error(`YAML rule "${rule.id}": mode "metric" requires a "metric" block`);
  }

  const { measure, threshold, operator } = rule.metric;
  const compare = OPERATORS[operator];
  if (!compare) {
    throw new Error(`YAML rule "${rule.id}": unsupported operator "${operator}"`);
  }

  const extract = MEASURE_MAP[measure];
  if (!extract) {
    throw new Error(`YAML rule "${rule.id}": unsupported measure "${measure}"`);
  }

  return {
    id: rule.id,
    version: rule.version,
    category: rule.category,
    severity: rule.severity,
    description: rule.description,
    principle: rule.principle,
    applicable_to: rule.applicable_to,

    async run(
      file: CategorizedFile,
      _config: ParLintConfig,
      cwd: string,
    ): Promise<Finding[]> {
      if (rule.exclude_patterns?.length && matchesExclude(file.path, rule.exclude_patterns)) {
        return [];
      }

      const source = await readSource(file.path, cwd);
      const metrics = analyzeSource(source);
      const value = extract(metrics);

      if (!compare(value, threshold)) return [];

      const message = rule.message_template
        .replace(/\{value\}/g, String(value))
        .replace(/\{threshold\}/g, String(threshold));

      return [createFinding({
        rule_id: rule.id,
        file: file.path,
        line: 1,
        severity: rule.severity,
        message,
        source_principle: rule.principle ?? '',
        category: rule.category,
        fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L') ?? 'S',
        evidence_trail: [{
          tool: 'yaml-metric',
          query: { measure, threshold, operator, file: file.path },
          result: { value },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      })];
    },
  };
}

function compileAstGrepRule(rule: YamlRule): RuleDefinition {
  if (!rule.ast_grep) {
    throw new Error(`YAML rule "${rule.id}": mode "ast-grep" requires an "ast_grep" block`);
  }

  const { pattern } = rule.ast_grep;

  return {
    id: rule.id,
    version: rule.version,
    category: rule.category,
    severity: rule.severity,
    description: rule.description,
    principle: rule.principle,
    applicable_to: rule.applicable_to,

    async run(
      file: CategorizedFile,
      _config: ParLintConfig,
      cwd: string,
    ): Promise<Finding[]> {
      if (rule.exclude_patterns?.length && matchesExclude(file.path, rule.exclude_patterns)) {
        return [];
      }

      const matches = await findPattern(file.path, pattern, cwd);
      return matches.map((m) => {
        const message = rule.message_template
          .replace(/\{match\[0\]\}/g, m.text);

        return createFinding({
          rule_id: rule.id,
          file: file.path,
          line: m.line,
          column: m.column,
          end_line: m.endLine,
          end_column: m.endColumn,
          severity: rule.severity,
          message,
          source_principle: rule.principle ?? '',
          category: rule.category,
          fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L') ?? 'S',
          evidence_trail: [{
            tool: 'yaml-ast-grep',
            query: { pattern, file: file.path },
            result: { line: m.line, text: m.text },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        });
      });
    },
  };
}

export async function loadYamlRules(paths: string[], cwd: string): Promise<RuleDefinition[]> {
  const rules: RuleDefinition[] = [];

  for (const p of paths) {
    if (!p.endsWith('.yaml') && !p.endsWith('.yml')) continue;

    const absolute = resolve(cwd, p);
    let content: string;
    try {
      content = await readFile(absolute, 'utf-8');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read YAML rule "${p}": ${msg}`);
    }

    let doc: YamlRuleDocument;
    try {
      doc = parseYaml(content) as YamlRuleDocument;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse YAML rule "${p}": ${msg}`);
    }

    rules.push(compileYamlRule(doc));
  }

  return rules;
}

export function compileYamlRule(doc: YamlRuleDocument): RuleDefinition {
  if (!doc.rule) {
    throw new Error('YAML rule document must have a "rule" key');
  }

  const rule = doc.rule;

  if (!rule.id || !rule.version || !rule.category || !rule.severity || !rule.applicable_to || !rule.mode || !rule.message_template) {
    throw new Error(`YAML rule "${rule.id ?? 'unknown'}": missing required fields (id, version, category, severity, applicable_to, mode, message_template)`);
  }

  switch (rule.mode) {
    case 'regex':
      return compileRegexRule(rule);
    case 'metric':
      return compileMetricRule(rule);
    case 'ast-grep':
      return compileAstGrepRule(rule);
    default:
      throw new Error(`YAML rule "${rule.id}": unsupported mode "${rule.mode}". Supported: regex, metric, ast-grep`);
  }
}
