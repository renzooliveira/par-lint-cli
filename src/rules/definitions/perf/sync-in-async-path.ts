import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SYNC_PATTERNS = [
  { regex: /\.Result\b/g, label: '.Result' },
  { regex: /\.Wait\(\)/g, label: '.Wait()' },
  { regex: /\.GetAwaiter\(\)\.GetResult\(\)/g, label: '.GetAwaiter().GetResult()' },
];

export const syncInAsyncPathRule: RuleDefinition = {
  id: 'perf/sync-in-async-path',
  version: '1.0.0',
  category: 'perf',
  severity: 'error',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let inAsyncMethod = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (/\basync\b/.test(line)) {
        inAsyncMethod = true;
      }

      if (inAsyncMethod) {
        for (const pattern of SYNC_PATTERNS) {
          pattern.regex.lastIndex = 0;
          const match = pattern.regex.exec(line);
          if (match) {
            findings.push(createFinding({
              rule_id: 'perf/sync-in-async-path',
              file: file.path,
              line: i + 1,
              column: match.index + 1,
              severity: 'error',
              message: `Synchronous blocking call ${pattern.label} in async context. This blocks the event loop.`,
              source_principle: 'Async path must not block',
              category: 'perf',
              fix_complexity: 'M',
              evidence_trail: [{
                tool: 'T7.find_pattern',
                query: { pattern: pattern.label, file: file.path },
                result: { line: i + 1, text: line.trim() },
                timestamp: new Date().toISOString(),
                cache_hit: false,
              }],
            }));
          }
        }
      }

      if (line.includes('}') && !line.includes('{')) {
        inAsyncMethod = false;
      }
    }

    return findings;
  },
};
