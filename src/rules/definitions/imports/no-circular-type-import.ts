import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TYPE_IMPORT_RE = /^import\s+type\s+.*from\s+['"](\.[^'"]+)['"]/;

export const noCircularTypeImportRule: RuleDefinition = {
  id: 'imports/no-circular-type-import',
  version: '1.0.0',
  category: 'imports',
  severity: 'warning',
  description: 'Detects circular dependencies via import type statements',
  principle: 'Circular type imports indicate design coupling even if they do not break runtime',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    const myDir = file.path.split('/').slice(0, -1);
    const myFile = file.path.split('/').pop()!.replace(/\.ts$/, '');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(TYPE_IMPORT_RE);
      if (!match) continue;

      const importPath = match[1]!;
      const resolvedParts = [...myDir];
      for (const segment of importPath.split('/')) {
        if (segment === '.') continue;
        if (segment === '..') resolvedParts.pop();
        else resolvedParts.push(segment);
      }
      const resolvedFile = resolvedParts.join('/');

      try {
        const importedSource = await readSource(resolvedFile + '.ts', cwd);
        const escapedPath = myFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const backImportRe = new RegExp(`from\\s+['"][^'"]*${escapedPath}['"]`);
        if (backImportRe.test(importedSource)) {
          findings.push(createFinding({
            rule_id: 'imports/no-circular-type-import',
            file: file.path,
            line: i + 1,
            severity: 'warning',
            message: `Circular type import with '${importPath}'. Consider extracting shared types to a separate file.`,
            source_principle: 'Circular type imports indicate design coupling',
            category: 'imports',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex.circularTypeImport',
              query: { file: file.path },
              result: { line: i + 1, target: importPath },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      } catch {
        // File not readable — skip
      }
    }

    return findings;
  },
};
