import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const functionTooManyParamsRule: RuleDefinition = {
  id: 'typescript/function-too-many-params',
  version: '1.0.0',
  category: 'typescript',
  severity: 'info',
  description: 'Detects functions with 4+ parameters instead of options object',
  principle: 'Many parameters hurt readability; use an options/config object instead',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    const maxParams = 3;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const fnMatch = line.match(/(?:function\s+\w+|(?:async\s+)?\w+)\s*\(([^)]+)\)\s*[:{]/);
      if (!fnMatch) continue;

      const params = fnMatch[1]!.split(',').filter(p => p.trim().length > 0);
      if (params.length > maxParams) {
        findings.push(createFinding({
          rule_id: 'typescript/function-too-many-params',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Function has ${params.length} parameters (max ${maxParams}). Consider using an options object.`,
          source_principle: 'Functions with many params are hard to call correctly',
          category: 'typescript',
          fix_complexity: 'M',
          suggested_fix: {
            kind: 'extract_method',
            description: `Extract ${params.length} params into options object: fn(opts: FnOptions)`,
          },
          evidence_trail: [{
            tool: 'regex.paramCount',
            query: { file: file.path },
            result: { line: i + 1, paramCount: params.length },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
