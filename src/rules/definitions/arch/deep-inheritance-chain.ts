import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const deepInheritanceChainRule: RuleDefinition = {
  id: 'arch/deep-inheritance-chain',
  version: '1.0.0',
  category: 'arch',
  severity: 'warning',
  description: 'Detects inheritance chains deeper than 2 levels',
  principle: 'Deep inheritance creates fragile base class problems; prefer composition',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];

    const classes = new Map<string, string | null>();
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    let match;
    while ((match = classRegex.exec(source)) !== null) {
      classes.set(match[1]!, match[2] ?? null);
    }

    for (const [name, parent] of classes) {
      if (!parent) continue;
      let depth = 0;
      let current: string | null | undefined = parent;
      while (current && classes.has(current)) {
        depth++;
        current = classes.get(current);
      }
      if (depth >= 2) {
        const line = source.substring(0, source.indexOf(`class ${name}`)).split('\n').length;
        findings.push(createFinding({
          rule_id: 'arch/deep-inheritance-chain',
          file: file.path,
          line,
          severity: 'warning',
          message: `Class "${name}" has inheritance depth ${depth + 1}. Prefer composition over deep inheritance.`,
          source_principle: 'Favor composition over inheritance to reduce coupling',
          category: 'arch',
          fix_complexity: 'XL',
          evidence_trail: [{
            tool: 'regex.inheritanceChain',
            query: { file: file.path },
            result: { line, className: name, depth: depth + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
