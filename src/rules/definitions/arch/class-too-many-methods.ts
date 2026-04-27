import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const classTooManyMethodsRule: RuleDefinition = {
  id: 'arch/class-too-many-methods',
  version: '1.0.0',
  category: 'arch',
  severity: 'warning',
  description: 'Detects classes with more than 15 methods',
  principle: 'Too many methods indicate a class with too many responsibilities',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const classMatch = source.match(/class\s+(\w+)/);
    if (!classMatch) return [];

    const maxMethods = 15;
    const methodCount = (source.match(/^\s+(?:async\s+)?(?:private\s+|protected\s+|public\s+|static\s+)*\w+\s*\([^)]*\)\s*(?::\s*\S+)?\s*\{/gm) ?? []).length;

    if (methodCount <= maxMethods) return [];

    const line = source.substring(0, classMatch.index!).split('\n').length;

    return [createFinding({
      rule_id: 'arch/class-too-many-methods',
      file: file.path,
      line,
      severity: 'warning',
      message: `Class "${classMatch[1]}" has ${methodCount} methods (max ${maxMethods}). Consider splitting responsibilities.`,
      source_principle: 'Single Responsibility: each class should have one reason to change',
      category: 'arch',
      fix_complexity: 'XL',
      evidence_trail: [{
        tool: 'regex.methodCount',
        query: { file: file.path },
        result: { line, className: classMatch[1], methodCount },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
