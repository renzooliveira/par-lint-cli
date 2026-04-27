import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const METHOD_ASYNC_RE = /\{\{\s*(\w+)\(\)\s*\|\s*async\s*\}\}/g;

export const observableInTemplateCallRule: RuleDefinition = {
  id: 'rxjs/observable-in-template-call',
  version: '1.0.0',
  category: 'rxjs',
  severity: 'error',
  description: 'Detects method() | async in template creating new Observable each change detection',
  principle: 'Method calls in templates with async pipe create new subscriptions on every CD cycle',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const match of line.matchAll(METHOD_ASYNC_RE)) {
        findings.push(createFinding({
          rule_id: 'rxjs/observable-in-template-call',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: `{{ ${match[1]}() | async }} creates new Observable each change detection. Use a property instead.`,
          source_principle: 'Template method calls with async pipe cause performance issues',
          category: 'rxjs',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'method() | async', file: file.path },
            result: { line: i + 1, method: match[1] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
