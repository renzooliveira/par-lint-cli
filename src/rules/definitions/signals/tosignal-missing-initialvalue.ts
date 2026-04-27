import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const tosignalMissingInitialvalueRule: RuleDefinition = {
  id: 'signals/tosignal-missing-initialvalue',
  version: '1.0.0',
  category: 'signals',
  severity: 'warning',
  description: 'Detects toSignal() without initialValue option',
  principle: 'Without initialValue, toSignal returns T | undefined, complicating template logic',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('toSignal')) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/toSignal\s*\(/.test(line) && !/initialValue/.test(line) && !/import/.test(line) && !/requireSync/.test(line)) {
        findings.push(createFinding({
          rule_id: 'signals/tosignal-missing-initialvalue',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'toSignal() without initialValue returns T | undefined. Provide initialValue for type safety.',
          source_principle: 'Explicit initial values prevent undefined checks in templates',
          category: 'signals',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.toSignalNoInit',
            query: { file: file.path },
            result: { line: i + 1, match: line.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
