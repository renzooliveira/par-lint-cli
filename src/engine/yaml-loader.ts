import type { RuleDefinition } from './runner.js';
import type { Finding } from '../types/finding.js';
import type { CategorizedFile } from '../discovery/categorizer.js';
import type { ParLintConfig } from '../types/config.js';
import { createFinding } from './finding.js';
import { readSource, findPattern } from '../adapters/ast-grep.js';
import { analyzeSource } from '../adapters/ts-metrics.js';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export interface YamlRegexConfig {
  pattern: string;
  capture_group?: number;
  multiline?: boolean;
  multi_match?: boolean;
}

export interface YamlSuggestedFix {
  kind: 'replace' | 'extract_method' | 'move_method' | 'rename' | 'add_validation' | 'manual';
  description: string;
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

export interface YamlFilePresenceConfig {
  must_contain?: string;
  must_not_contain?: string;
  guard_contains?: string;
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
  skip_comments?: boolean;
  mode: 'regex' | 'metric' | 'ast-grep' | 'file-presence';
  regex?: YamlRegexConfig;
  metric?: YamlMetricConfig;
  ast_grep?: YamlAstGrepConfig;
  file_presence?: YamlFilePresenceConfig;
  message_template: string;
  fix_complexity: string;
  suggested_fix?: YamlSuggestedFix;
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
        const line = lines[i]!;
        if (rule.skip_comments) {
          const trimmed = line.trimStart();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        }

        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(line)) !== null) {
          findings.push(createFinding({
            rule_id: rule.id,
            file: file.path,
            line: i + 1,
            severity: rule.severity,
            message: interpolateMessage(rule.message_template, match),
            source_principle: rule.principle ?? '',
            category: rule.category,
            fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L' | 'XL') ?? 'S',
            suggested_fix: rule.suggested_fix
              ? { kind: rule.suggested_fix.kind, description: interpolateMessage(rule.suggested_fix.description, match) }
              : undefined,
            evidence_trail: [{
              tool: 'yaml-regex',
              query: { pattern: rule.regex!.pattern, file: file.path },
              result: { line: i + 1, match: match[0] },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
          if (!rule.regex!.multi_match) break;
        }
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
        fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L' | 'XL') ?? 'S',
        suggested_fix: rule.suggested_fix
          ? { kind: rule.suggested_fix.kind, description: rule.suggested_fix.description }
          : undefined,
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
          fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L' | 'XL') ?? 'S',
          suggested_fix: rule.suggested_fix
            ? { kind: rule.suggested_fix.kind, description: rule.suggested_fix.description.replace(/\{match\[0\]\}/g, m.text) }
            : undefined,
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

function compileFilePresenceRule(rule: YamlRule): RuleDefinition {
  if (!rule.file_presence) {
    throw new Error(`YAML rule "${rule.id}": mode "file-presence" requires a "file_presence" block`);
  }

  const { must_contain, must_not_contain, guard_contains } = rule.file_presence;
  const hasContain = typeof must_contain === 'string' && must_contain.length > 0;
  const hasNotContain = typeof must_not_contain === 'string' && must_not_contain.length > 0;
  const hasGuard = typeof guard_contains === 'string' && guard_contains.length > 0;

  if (!hasContain && !hasNotContain) {
    throw new Error(`YAML rule "${rule.id}": "file_presence" requires at least one of "must_contain" or "must_not_contain"`);
  }
  if (hasContain && hasNotContain) {
    throw new Error(`YAML rule "${rule.id}": "file_presence" cannot have both "must_contain" and "must_not_contain" — use "guard_contains" + "must_not_contain" for compound checks`);
  }
  if (hasGuard && hasContain) {
    throw new Error(`YAML rule "${rule.id}": "guard_contains" is only supported with "must_not_contain", not "must_contain"`);
  }

  const base = {
    id: rule.id,
    version: rule.version,
    category: rule.category,
    severity: rule.severity,
    description: rule.description,
    principle: rule.principle,
    applicable_to: rule.applicable_to,
  };

  if (hasGuard) {
    const guardRe = new RegExp(guard_contains!);
    const violationRe = new RegExp(must_not_contain!);

    return {
      ...base,
      async run(file: CategorizedFile, _config: ParLintConfig, cwd: string): Promise<Finding[]> {
        if (rule.exclude_patterns?.length && matchesExclude(file.path, rule.exclude_patterns)) return [];
        const source = await readSource(file.path, cwd);
        if (!guardRe.test(source)) return [];
        if (violationRe.test(source)) return [];
        return [createFinding({
          rule_id: rule.id,
          file: file.path,
          line: 1,
          severity: rule.severity,
          message: rule.message_template,
          source_principle: rule.principle ?? '',
          category: rule.category,
          fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L' | 'XL') ?? 'S',
          suggested_fix: rule.suggested_fix
            ? { kind: rule.suggested_fix.kind, description: rule.suggested_fix.description }
            : undefined,
          evidence_trail: [{
            tool: 'yaml-file-presence',
            query: { guard: guard_contains, pattern: must_not_contain, expect: 'absent', file: file.path },
            result: { guardMatched: true, violationMatched: false },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        })];
      },
    };
  }

  const pattern = (hasContain ? must_contain : must_not_contain)!;
  const expectMatch = hasContain;
  const re = new RegExp(pattern);

  return {
    ...base,
    async run(
      file: CategorizedFile,
      _config: ParLintConfig,
      cwd: string,
    ): Promise<Finding[]> {
      if (rule.exclude_patterns?.length && matchesExclude(file.path, rule.exclude_patterns)) {
        return [];
      }

      const source = await readSource(file.path, cwd);
      const matches = re.test(source);

      if (expectMatch ? matches : !matches) return [];

      return [createFinding({
        rule_id: rule.id,
        file: file.path,
        line: 1,
        severity: rule.severity,
        message: rule.message_template,
        source_principle: rule.principle ?? '',
        category: rule.category,
        fix_complexity: (rule.fix_complexity as 'S' | 'M' | 'L' | 'XL') ?? 'S',
        suggested_fix: rule.suggested_fix
          ? { kind: rule.suggested_fix.kind, description: rule.suggested_fix.description }
          : undefined,
        evidence_trail: [{
          tool: 'yaml-file-presence',
          query: { pattern, expect: expectMatch ? 'present' : 'absent', file: file.path },
          result: { matched: matches },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      })];
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '..');

async function discoverYamlFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await discoverYamlFiles(full));
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      results.push(full);
    }
  }
  return results;
}

export async function loadBuiltinYamlRules(): Promise<RuleDefinition[]> {
  const yamlDir = join(PKG_ROOT, 'rules', 'yaml');
  const files = await discoverYamlFiles(yamlDir);
  if (files.length === 0) return [];

  const rules: RuleDefinition[] = [];
  for (const absolute of files) {
    const content = await readFile(absolute, 'utf-8');
    const doc = parseYaml(content) as YamlRuleDocument;
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
    case 'file-presence':
      return compileFilePresenceRule(rule);
    default:
      throw new Error(`YAML rule "${rule.id}": unsupported mode "${rule.mode}". Supported: regex, metric, ast-grep, file-presence`);
  }
}
