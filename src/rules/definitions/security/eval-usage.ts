import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const evalUsageRule: RuleDefinition = {
  id: 'security/eval-usage',
  version: '1.0.0',
  category: 'security',
  severity: 'error',
  description: 'Detects eval() and new Function() usage',
  principle: 'eval and dynamic code execution are XSS vectors',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^\s*\/\//.test(line)) continue;

      if (/\beval\s*\(/.test(line)) {
        findings.push(createFinding({
          rule_id: 'security/eval-usage',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: 'eval() is a security risk. Use safer alternatives like JSON.parse or structured data.',
          source_principle: 'Dynamic code execution enables injection attacks',
          category: 'security',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.eval',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
      if (/new\s+Function\s*\(/.test(line)) {
        findings.push(createFinding({
          rule_id: 'security/eval-usage',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: 'new Function() is equivalent to eval(). Use safer alternatives.',
          source_principle: 'Dynamic code execution enables injection attacks',
          category: 'security',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.newFunction',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
