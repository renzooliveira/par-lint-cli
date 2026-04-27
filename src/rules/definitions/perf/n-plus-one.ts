import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const LOOP_START_RE = /\b(for|while)\b/;
const HTTP_CALL_RE = /this\.http\.\w+\s*\(|this\.\w+(?:Service|Repository|Api|Client)\.\w+\s*\(|\bfetch\s*\(|\.query\s*\(|\.findOne\s*\(|\.findById\s*\(/;

export const nPlusOneRule: RuleDefinition = {
  id: 'perf/n-plus-one',
  version: '1.1.0',
  category: 'perf',
  severity: 'error',
  description: 'Detects HTTP/repository calls inside loops (N+1 pattern)',
  principle: 'External resource access inside a loop is an anti-pattern — batch the request',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let inLoop = false;
    let loopDepth = 0;
    let loopStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (LOOP_START_RE.test(line)) {
        if (!inLoop) {
          inLoop = true;
          loopStartLine = i;
          loopDepth = 0;
        }
      }

      if (inLoop) {
        loopDepth += (line.match(/{/g) ?? []).length;
        loopDepth -= (line.match(/}/g) ?? []).length;

        if (HTTP_CALL_RE.test(line)) {
          findings.push(createFinding({
            rule_id: 'perf/n-plus-one',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: `HTTP/repository call inside loop (started line ${loopStartLine + 1}). Batch the request.`,
            source_principle: 'External resource access inside loop causes N+1 problem',
            category: 'perf',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex',
              query: { file: file.path },
              result: { line: i + 1, loopStart: loopStartLine + 1 },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }

        if (loopDepth <= 0 && i > loopStartLine) {
          inLoop = false;
        }
      }
    }

    return findings;
  },
};
