import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const classTooManyFieldsRule: RuleDefinition = {
  id: 'arch/class-too-many-fields',
  version: '1.0.0',
  category: 'arch',
  severity: 'warning',
  description: 'Detects classes with more than 7 fields',
  principle: 'Too many fields indicate data clumps or missing value objects',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const classMatch = source.match(/class\s+(\w+)/);
    if (!classMatch) return [];

    const maxFields = 7;
    const fieldCount = (source.match(/^\s+(?:private\s+|protected\s+|public\s+|readonly\s+|static\s+)*\w+\s*(?::\s*\S+)?\s*=\s*/gm) ?? []).length;

    if (fieldCount <= maxFields) return [];

    const line = source.substring(0, classMatch.index!).split('\n').length;

    return [createFinding({
      rule_id: 'arch/class-too-many-fields',
      file: file.path,
      line,
      severity: 'warning',
      message: `Class "${classMatch[1]}" has ${fieldCount} fields (max ${maxFields}). Consider extracting value objects.`,
      source_principle: 'Many fields signal a data clump code smell',
      category: 'arch',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex.fieldCount',
        query: { file: file.path },
        result: { line, className: classMatch[1], fieldCount },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
