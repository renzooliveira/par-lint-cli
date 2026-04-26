import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const NGONINIT_RE = /ngOnInit\s*\(\s*\)/;
const ASSIGNMENT_IN_INIT_RE = /this\.(\w+)\s*=\s*this\.(\w+)/g;

export const derivedStateAsPropertyRule: RuleDefinition = {
  id: 'state/derived-state-as-property',
  version: '1.0.0',
  category: 'state',
  severity: 'warning',
  applicable_to: ['is_component'],

  async run(file, config, cwd) {
    const opts = config.rules['state/derived-state-as-property']?.options as {
      maxDerivedAssignments?: number;
    } | undefined;
    const maxDerived = opts?.maxDerivedAssignments ?? 2;

    const source = await readSource(file.path, cwd);

    if (!NGONINIT_RE.test(source)) return [];

    const lines = source.split('\n');
    let inInit = false;
    let braceDepth = 0;
    let initDepth = 0;
    const derivedAssignments: Array<{ line: number; target: string; source: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (NGONINIT_RE.test(line)) {
        inInit = true;
        initDepth = braceDepth;
      }

      braceDepth += (line.match(/{/g) ?? []).length;
      braceDepth -= (line.match(/}/g) ?? []).length;

      if (inInit) {
        ASSIGNMENT_IN_INIT_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = ASSIGNMENT_IN_INIT_RE.exec(line)) !== null) {
          derivedAssignments.push({
            line: i + 1,
            target: match[1]!,
            source: match[2]!,
          });
        }

        if (braceDepth <= initDepth && i > 0) {
          inInit = false;
        }
      }
    }

    if (derivedAssignments.length > maxDerived) {
      return [createFinding({
        rule_id: 'state/derived-state-as-property',
        file: file.path,
        line: derivedAssignments[0]!.line,
        severity: 'warning',
        message: `${derivedAssignments.length} derived assignments in ngOnInit (max ${maxDerived}). Use computed() signals instead.`,
        source_principle: 'Derived state should be computed(), not manually assigned in lifecycle',
        category: 'state',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex',
          query: { file: file.path },
          result: { count: derivedAssignments.length, assignments: derivedAssignments.map((a) => `${a.target} = ${a.source}`) },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      })];
    }

    return [];
  },
};
