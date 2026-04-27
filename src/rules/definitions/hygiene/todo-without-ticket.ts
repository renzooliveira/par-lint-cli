import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TODO_RE = /\/\/\s*(TODO|FIXME|HACK|XXX)\b/i;
const TICKET_RE = /#\d+|[A-Z]+-\d+|https?:\/\//;

export const todoWithoutTicketRule: RuleDefinition = {
  id: 'hygiene/todo-without-ticket',
  version: '1.0.0',
  category: 'hygiene',
  severity: 'info',
  description: 'Detects TODO/FIXME/HACK without ticket reference',
  principle: 'TODOs without tickets are forgotten; link to a tracker',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = TODO_RE.exec(line);
      if (!match) continue;

      const afterKeyword = line.substring(match.index!);
      if (TICKET_RE.test(afterKeyword)) continue;

      findings.push(createFinding({
        rule_id: 'hygiene/todo-without-ticket',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `${match[1]} without ticket reference. Add #123, PROJ-456, or URL.`,
        source_principle: 'Track TODOs with tickets so they get resolved',
        category: 'hygiene',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'TODO without ticket', file: file.path },
          result: { line: i + 1, keyword: match[1] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
