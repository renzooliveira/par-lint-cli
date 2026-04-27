import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CODE_SYNTAX_RE = /^\s*\/\/\s*(import\s|const\s|let\s|var\s|function\s|if\s*\(|return\s|class\s|export\s|await\s|async\s|for\s*\(|while\s*\(|switch\s*\(|\w+\.\w+\()/;

export const commentedOutCodeRule: RuleDefinition = {
  id: 'hygiene/commented-out-code',
  version: '1.0.0',
  category: 'hygiene',
  severity: 'info',
  description: 'Detects commented-out code blocks (use git for history)',
  principle: 'Git is the history; commented code is noise',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let consecutiveCodeComments = 0;
    let blockStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (CODE_SYNTAX_RE.test(line)) {
        if (consecutiveCodeComments === 0) blockStartLine = i + 1;
        consecutiveCodeComments++;
      } else {
        if (consecutiveCodeComments >= 2) {
          findings.push(createFinding({
            rule_id: 'hygiene/commented-out-code',
            file: file.path,
            line: blockStartLine,
            severity: 'info',
            message: `${consecutiveCodeComments} lines of commented-out code. Use git for history.`,
            source_principle: 'Git is history, not comments',
            category: 'hygiene',
            fix_complexity: 'S',
            evidence_trail: [{
              tool: 'regex',
              query: { pattern: 'commented code', file: file.path },
              result: { line: blockStartLine, lines: consecutiveCodeComments },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
        consecutiveCodeComments = 0;
      }
    }

    if (consecutiveCodeComments >= 2) {
      findings.push(createFinding({
        rule_id: 'hygiene/commented-out-code',
        file: file.path,
        line: blockStartLine,
        severity: 'info',
        message: `${consecutiveCodeComments} lines of commented-out code. Use git for history.`,
        source_principle: 'Git is history, not comments',
        category: 'hygiene',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'commented code', file: file.path },
          result: { line: blockStartLine, lines: consecutiveCodeComments },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
