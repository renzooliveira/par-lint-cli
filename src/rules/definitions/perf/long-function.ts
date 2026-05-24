import type { RuleDefinition } from '../../../engine/runner.js';
import { extractFunctions } from '../../../adapters/ts-metrics.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const longFunctionRule: RuleDefinition = {
  id: 'perf/long-function',
  version: '1.0.0',
  category: 'perf',
  severity: 'warning',
  description: 'Detects functions exceeding maximum line count',
  principle: 'Long functions accumulate responsibilities — extract smaller focused functions',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['perf/long-function']?.options as {
      maxLines?: number;
    } | undefined;
    const maxLines = opts?.maxLines ?? 60;

    const source = await readSource(file.path, cwd);
    const functions = extractFunctions(source);

    return functions
      .filter((fn) => fn.lineCount > maxLines)
      .map((fn) => createFinding({
        rule_id: 'perf/long-function',
        file: file.path,
        line: fn.line,
        severity: 'warning',
        message: `Function '${fn.name}' is ${fn.lineCount} lines (max ${maxLines}). Extract smaller functions.`,
        source_principle: 'Long functions are hard to test, read and maintain',
        category: 'perf',
        fix_complexity: 'M',
        suggested_fix: {
          kind: 'extract_method',
          description: `Extract '${fn.name}' (${fn.lineCount} lines) into smaller focused functions`,
        },
        evidence_trail: [{
          tool: 'ts-metrics.extractFunctions',
          query: { file: file.path },
          result: { name: fn.name, lineCount: fn.lineCount, maxLines },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
  },
};
