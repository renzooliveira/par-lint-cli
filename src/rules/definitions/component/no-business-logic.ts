import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const LIFECYCLE_HOOKS = /^\s*(?:ngOnInit|ngOnChanges|ngOnDestroy|ngAfterViewInit|ngAfterContentInit|constructor)\s*\(/;
const BRANCH_RE = /\b(if|else\s+if|switch|try)\b/g;

export const noBusinessLogicRule: RuleDefinition = {
  id: 'component/no-business-logic',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  applicable_to: ['is_component'],

  async run(file, config, cwd) {
    const opts = config.rules['component/no-business-logic']?.options as {
      maxBranches?: number;
    } | undefined;
    const maxBranches = opts?.maxBranches ?? 3;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    let branchCount = 0;
    let insideLifecycle = false;
    let braceDepth = 0;
    let lifecycleDepth = 0;

    for (const line of lines) {
      if (LIFECYCLE_HOOKS.test(line)) {
        insideLifecycle = true;
        lifecycleDepth = braceDepth;
      }

      braceDepth += (line.match(/{/g) ?? []).length;
      braceDepth -= (line.match(/}/g) ?? []).length;

      if (insideLifecycle && braceDepth <= lifecycleDepth) {
        insideLifecycle = false;
      }

      if (!insideLifecycle) {
        BRANCH_RE.lastIndex = 0;
        while (BRANCH_RE.exec(line) !== null) {
          branchCount++;
        }
      }
    }

    if (branchCount > maxBranches) {
      return [createFinding({
        rule_id: 'component/no-business-logic',
        file: file.path,
        line: 1,
        severity: 'warning',
        message: `Component has ${branchCount} branching statements (max ${maxBranches}). Move business logic to a service.`,
        source_principle: 'Components should delegate logic to services',
        category: 'component',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex',
          query: { file: file.path },
          result: { branchCount, maxBranches },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      })];
    }

    return [];
  },
};
