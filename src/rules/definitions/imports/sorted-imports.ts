import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IMPORT_LINE_RE = /^\s*import\s+.*from\s+['"]([^'"]+)['"]/;

function classifyImport(path: string): number {
  if (path.startsWith('@angular/')) return 0;
  if (!path.startsWith('.') && !path.startsWith('@app/') && !path.startsWith('@shared/') && !path.startsWith('@core/') && !path.startsWith('@env/')) return 1;
  if (path.startsWith('@')) return 2;
  return 3;
}

export const sortedImportsRule: RuleDefinition = {
  id: 'imports/sorted-imports',
  version: '1.0.0',
  category: 'imports',
  severity: 'info',
  description: 'Detects imports not grouped in standard order: @angular, third-party, aliases, relative',
  principle: 'Consistent import order improves readability and reduces merge conflicts',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const imports: { line: number; group: number; path: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const match = IMPORT_LINE_RE.exec(lines[i]!);
      if (!match) {
        if (imports.length > 0 && lines[i]!.trim() !== '') break;
        continue;
      }
      imports.push({ line: i + 1, group: classifyImport(match[1]!), path: match[1]! });
    }

    if (imports.length <= 1) return [];

    let maxGroupSeen = -1;
    for (const imp of imports) {
      if (imp.group < maxGroupSeen) {
        return [createFinding({
          rule_id: 'imports/sorted-imports',
          file: file.path,
          line: imp.line,
          severity: 'info',
          message: `Import "${imp.path}" is out of order. Expected: @angular → third-party → path aliases → relative.`,
          source_principle: 'Consistent import order improves readability',
          category: 'imports',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'import order', file: file.path },
            result: { line: imp.line, group: imp.group, expected: maxGroupSeen },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        })];
      }
      maxGroupSeen = Math.max(maxGroupSeen, imp.group);
    }

    return [];
  },
};
