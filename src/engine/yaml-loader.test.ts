import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compileYamlRule, loadYamlRules, type YamlRuleDocument } from './yaml-loader.js';
import type { CategorizedFile } from '../discovery/categorizer.js';
import type { ParLintConfig } from '../types/config.js';
import path from 'node:path';

vi.mock('../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
  findPattern: vi.fn(),
}));

import { readSource, findPattern } from '../adapters/ast-grep.js';
import type { AstGrepMatch } from '../adapters/ast-grep.js';
const mockReadSource = vi.mocked(readSource);
const mockFindPatternFn = vi.mocked(findPattern);

const defaultConfig = {} as ParLintConfig;

function makeFile(path: string): CategorizedFile {
  return { path, tags: ['is_typescript'] } as CategorizedFile;
}

function mockSource(source: string) {
  mockReadSource.mockResolvedValueOnce(source);
}

function mockFindPattern(matches: AstGrepMatch[]) {
  mockFindPatternFn.mockResolvedValueOnce(matches);
}

describe('compileYamlRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('rejects document without rule key', () => {
      expect(() => compileYamlRule({} as YamlRuleDocument)).toThrow('must have a "rule" key');
    });

    it('rejects rule without required fields', () => {
      const doc = { rule: { id: 'test/x' } } as YamlRuleDocument;
      expect(() => compileYamlRule(doc)).toThrow();
    });

    it('rejects unknown mode', () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/x',
          version: '1.0.0',
          category: 'test',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'unknown' as 'regex',
          message_template: 'msg',
          fix_complexity: 'S',
        },
      };
      expect(() => compileYamlRule(doc)).toThrow('mode');
    });
  });

  describe('mode: regex', () => {
    const yamlDoc: YamlRuleDocument = {
      rule: {
        id: 'hygiene/console-log-in-production',
        version: '1.0.0',
        category: 'hygiene',
        severity: 'warning',
        description: 'Detects console.log in production code',
        principle: 'Console logging pollutes output',
        applicable_to: ['is_typescript'],
        exclude_patterns: ['*.spec.ts', '*.test.ts'],
        mode: 'regex',
        regex: {
          pattern: '\\bconsole\\.(log|debug|info)\\s*\\(',
          capture_group: 1,
        },
        message_template: 'console.{match[1]}() in production code.',
        fix_complexity: 'S',
      },
    };

    it('compiles to valid RuleDefinition', () => {
      const rule = compileYamlRule(yamlDoc);
      expect(rule.id).toBe('hygiene/console-log-in-production');
      expect(rule.version).toBe('1.0.0');
      expect(rule.category).toBe('hygiene');
      expect(rule.severity).toBe('warning');
      expect(rule.applicable_to).toEqual(['is_typescript']);
      expect(typeof rule.run).toBe('function');
    });

    it('finds matches in source lines', async () => {
      const rule = compileYamlRule(yamlDoc);
      mockSource("const x = 1;\nconsole.log('hello');\nconsole.error('ok');");

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.line).toBe(2);
      expect(findings[0]!.message).toBe('console.log() in production code.');
    });

    it('respects exclude_patterns', async () => {
      const rule = compileYamlRule(yamlDoc);

      const findings = await rule.run(makeFile('src/app.spec.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(0);
      expect(mockReadSource).not.toHaveBeenCalled();
    });

    it('finds multiple matches in same file', async () => {
      const rule = compileYamlRule(yamlDoc);
      mockSource("console.log('a');\nconsole.debug('b');\nconsole.info('c');");

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(3);
      expect(findings[0]!.message).toBe('console.log() in production code.');
      expect(findings[1]!.message).toBe('console.debug() in production code.');
      expect(findings[2]!.message).toBe('console.info() in production code.');
    });

    it('handles regex without capture group', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/debugger',
          version: '1.0.0',
          category: 'test',
          severity: 'error',
          applicable_to: ['is_typescript'],
          mode: 'regex',
          regex: { pattern: '\\bdebugger\\b' },
          message_template: 'debugger statement found',
          fix_complexity: 'S',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('const x = 1;\ndebugger;\nconst y = 2;');

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.line).toBe(2);
      expect(findings[0]!.message).toBe('debugger statement found');
    });

    it('respects skip_comments to skip lines starting with // or *', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'security/eval',
          version: '1.0.0',
          category: 'security',
          severity: 'error',
          applicable_to: ['is_typescript'],
          mode: 'regex',
          regex: { pattern: '\\beval\\s*\\(' },
          message_template: 'eval found',
          fix_complexity: 'M',
          skip_comments: true,
        },
      };

      const rule = compileYamlRule(doc);
      mockSource("// eval('skip me');\n  * eval('skip me too');\neval('detect');");

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.line).toBe(3);
    });

    it('propagates suggested_fix when present', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'typescript/ts-ignore',
          version: '1.0.0',
          category: 'typescript',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'regex',
          regex: { pattern: '@ts-(ignore|expect-error)' },
          message_template: '@ts-{match[1]} without reason',
          fix_complexity: 'L',
          suggested_fix: {
            kind: 'replace',
            description: 'Add reason: @ts-{match[1]} -- explanation',
          },
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('// @ts-ignore');

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.suggested_fix).toEqual({
        kind: 'replace',
        description: 'Add reason: @ts-ignore -- explanation',
      });
    });

    it('supports fix_complexity XL', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'component/no-ngmodule',
          version: '1.0.0',
          category: 'component',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'regex',
          regex: { pattern: '@NgModule\\s*\\(' },
          message_template: 'NgModule found',
          fix_complexity: 'XL',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('@NgModule({})');

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.fix_complexity).toBe('XL');
    });

    it('finds only first match per line by default', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/word',
          version: '1.0.0',
          category: 'test',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'regex',
          regex: { pattern: '\\b(foo|bar)\\b' },
          message_template: 'Found: {match[1]}',
          fix_complexity: 'S',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('foo and bar on same line');

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toBe('Found: foo');
    });

    it('finds all matches per line when multi_match: true', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/word-multi',
          version: '1.0.0',
          category: 'test',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'regex',
          regex: { pattern: '\\b(foo|bar)\\b', multi_match: true },
          message_template: 'Found: {match[1]}',
          fix_complexity: 'S',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('foo and bar on same line\nbaz alone');

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(2);
      expect(findings[0]!.message).toBe('Found: foo');
      expect(findings[1]!.message).toBe('Found: bar');
      expect(findings[0]!.line).toBe(1);
      expect(findings[1]!.line).toBe(1);
    });

    it('supports match groups in message template', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/todo',
          version: '1.0.0',
          category: 'test',
          severity: 'info',
          applicable_to: ['is_typescript'],
          mode: 'regex',
          regex: { pattern: '//\\s*TODO:?\\s*(.+)' },
          message_template: 'TODO found: {match[1]}',
          fix_complexity: 'S',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('// TODO: fix this later');

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toBe('TODO found: fix this later');
    });
  });

  describe('mode: metric', () => {
    it('detects file exceeding line_count threshold', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'arch/file-too-long',
          version: '1.0.0',
          category: 'arch',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'metric',
          metric: {
            measure: 'line_count',
            scope: 'file',
            threshold: 5,
            operator: '>',
          },
          message_template: 'File has {value} lines, max {threshold}.',
          fix_complexity: 'M',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('line1\nline2\nline3\nline4\nline5\nline6');

      const findings = await rule.run(makeFile('src/big.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toBe('File has 6 lines, max 5.');
    });

    it('passes when under threshold', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'arch/file-too-long',
          version: '1.0.0',
          category: 'arch',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'metric',
          metric: {
            measure: 'line_count',
            scope: 'file',
            threshold: 100,
            operator: '>',
          },
          message_template: 'File has {value} lines, max {threshold}.',
          fix_complexity: 'M',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('line1\nline2');

      const findings = await rule.run(makeFile('src/small.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(0);
    });

    it('supports function_count measure', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'arch/too-many-functions',
          version: '1.0.0',
          category: 'arch',
          severity: 'error',
          applicable_to: ['is_typescript'],
          mode: 'metric',
          metric: {
            measure: 'function_count',
            scope: 'file',
            threshold: 2,
            operator: '>',
          },
          message_template: 'File has {value} functions, max {threshold}.',
          fix_complexity: 'L',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('function a() {\n  return 1;\n}\nfunction b() {\n  return 2;\n}\nfunction c() {\n  return 3;\n}');

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toBe('File has 3 functions, max 2.');
    });

    it('supports >= operator', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/gte',
          version: '1.0.0',
          category: 'test',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'metric',
          metric: {
            measure: 'line_count',
            scope: 'file',
            threshold: 3,
            operator: '>=',
          },
          message_template: 'File has {value} lines, max {threshold}.',
          fix_complexity: 'S',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('a\nb\nc');

      const findings = await rule.run(makeFile('src/x.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
    });

    it('supports export_count measure', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'arch/too-many-exports',
          version: '1.0.0',
          category: 'arch',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'metric',
          metric: {
            measure: 'export_count',
            scope: 'file',
            threshold: 1,
            operator: '>',
          },
          message_template: '{value} exports exceed max {threshold}.',
          fix_complexity: 'M',
        },
      };

      const rule = compileYamlRule(doc);
      mockSource('export const a = 1;\nexport const b = 2;\nexport const c = 3;');

      const findings = await rule.run(makeFile('src/barrel.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toBe('3 exports exceed max 1.');
    });
  });

  describe('mode: ast-grep', () => {
    it('finds AST pattern matches', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/eval-usage',
          version: '1.0.0',
          category: 'security',
          severity: 'error',
          applicable_to: ['is_typescript'],
          mode: 'ast-grep',
          ast_grep: { pattern: 'eval($$$)' },
          message_template: 'eval() is a security risk.',
          fix_complexity: 'M',
        },
      };

      const rule = compileYamlRule(doc);
      mockFindPattern([
        { text: "eval('code')", line: 5, column: 1, endLine: 5, endColumn: 13 },
      ]);

      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.line).toBe(5);
      expect(findings[0]!.message).toBe('eval() is a security risk.');
    });

    it('returns empty when no matches', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/eval-usage',
          version: '1.0.0',
          category: 'security',
          severity: 'error',
          applicable_to: ['is_typescript'],
          mode: 'ast-grep',
          ast_grep: { pattern: 'eval($$$)' },
          message_template: 'eval() found.',
          fix_complexity: 'S',
        },
      };

      const rule = compileYamlRule(doc);
      mockFindPattern([]);

      const findings = await rule.run(makeFile('src/safe.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(0);
    });

    it('respects exclude_patterns', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/eval-usage',
          version: '1.0.0',
          category: 'security',
          severity: 'error',
          applicable_to: ['is_typescript'],
          exclude_patterns: ['*.test.ts'],
          mode: 'ast-grep',
          ast_grep: { pattern: 'eval($$$)' },
          message_template: 'eval() found.',
          fix_complexity: 'S',
        },
      };

      const rule = compileYamlRule(doc);

      const findings = await rule.run(makeFile('src/app.test.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(0);
      expect(mockFindPatternFn).not.toHaveBeenCalled();
    });

    it('uses matched text in message with {match[0]}', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/subscribe',
          version: '1.0.0',
          category: 'rxjs',
          severity: 'warning',
          applicable_to: ['is_typescript'],
          mode: 'ast-grep',
          ast_grep: { pattern: '$OBJ.subscribe($$$)' },
          message_template: 'Found: {match[0]}',
          fix_complexity: 'M',
        },
      };

      const rule = compileYamlRule(doc);
      mockFindPattern([
        { text: 'this.http.get().subscribe(data => {})', line: 10, column: 5, endLine: 10, endColumn: 42 },
      ]);

      const findings = await rule.run(makeFile('src/svc.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toBe('Found: this.http.get().subscribe(data => {})');
    });

    it('finds multiple matches', async () => {
      const doc: YamlRuleDocument = {
        rule: {
          id: 'test/eval',
          version: '1.0.0',
          category: 'security',
          severity: 'error',
          applicable_to: ['is_typescript'],
          mode: 'ast-grep',
          ast_grep: { pattern: 'eval($$$)' },
          message_template: 'eval() usage.',
          fix_complexity: 'M',
        },
      };

      const rule = compileYamlRule(doc);
      mockFindPattern([
        { text: "eval('a')", line: 3, column: 1, endLine: 3, endColumn: 10 },
        { text: "eval('b')", line: 7, column: 1, endLine: 7, endColumn: 10 },
      ]);

      const findings = await rule.run(makeFile('src/x.ts'), defaultConfig, '/tmp');
      expect(findings).toHaveLength(2);
      expect(findings[0]!.line).toBe(3);
      expect(findings[1]!.line).toBe(7);
    });
  });

  describe('loadYamlRules', () => {
    it('loads and compiles a real YAML rule file', async () => {
      const cwd = path.resolve(import.meta.dirname, '../..');
      const rules = await loadYamlRules(
        ['rules/yaml/hygiene/console-log-in-production.yaml'],
        cwd,
      );

      expect(rules).toHaveLength(1);
      expect(rules[0]!.id).toBe('hygiene/console-log-in-production');
      expect(rules[0]!.severity).toBe('warning');
      expect(typeof rules[0]!.run).toBe('function');
    });

    it('skips non-yaml paths', async () => {
      const rules = await loadYamlRules(['some-rule.mjs'], '/tmp');
      expect(rules).toHaveLength(0);
    });

    it('loads YAML rule that produces findings', async () => {
      const cwd = path.resolve(import.meta.dirname, '../..');
      const rules = await loadYamlRules(
        ['rules/yaml/hygiene/console-log-in-production.yaml'],
        cwd,
      );
      const rule = rules[0]!;

      mockSource("console.log('test');\nconsole.error('ok');");
      const findings = await rule.run(makeFile('src/app.ts'), defaultConfig, cwd);
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toContain('console.log()');
    });
  });
});
