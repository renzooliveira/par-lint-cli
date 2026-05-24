import type { RuleDefinition } from '../../../engine/runner.js';
import { extractFunctions } from '../../../adapters/ts-metrics.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const highCyclomaticComplexityRule: RuleDefinition = {
  id: 'perf/high-cyclomatic-complexity',
  version: '1.0.0',
  category: 'perf',
  severity: 'warning',
  description: 'Detects functions with cyclomatic complexity above threshold',
  principle: 'High cyclomatic complexity makes code hard to test and maintain',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['perf/high-cyclomatic-complexity']?.options as {
      maxComplexity?: number;
    } | undefined;
    const maxComplexity = opts?.maxComplexity ?? 10;

    const source = await readSource(file.path, cwd);
    const functions = extractFunctions(source);

    return functions
      .filter((fn) => fn.cyclomaticComplexity > maxComplexity)
      .map((fn) => createFinding({
        rule_id: 'perf/high-cyclomatic-complexity',
        file: file.path,
        line: fn.line,
        severity: 'warning',
        message: `Function '${fn.name}' has cyclomatic complexity ${fn.cyclomaticComplexity} (max ${maxComplexity}). Simplify control flow.`,
        source_principle: 'High cyclomatic complexity correlates with bugs and hard-to-test code',
        category: 'perf',
        fix_complexity: 'M',
        suggested_fix: {
          kind: 'extract_method',
          description: `Simplify '${fn.name}' (complexity ${fn.cyclomaticComplexity}): extract branches into helpers or use strategy pattern`,
        },
        evidence_trail: [{
          tool: 'ts-metrics.extractFunctions',
          query: { file: file.path },
          result: { name: fn.name, complexity: fn.cyclomaticComplexity, maxComplexity },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
  },
};
