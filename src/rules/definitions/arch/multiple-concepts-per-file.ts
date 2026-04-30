import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const EXPORT_TYPE_RE = /^export\s+(?:interface|type|class|enum|abstract\s+class)\s+(\w+)/;
const REEXPORT_RE = /^export\s+\{/;
const BARREL_RE = /(?:^|\/)index\.ts$/;

export const multipleConceptsPerFileRule: RuleDefinition = {
  id: 'arch/multiple-concepts-per-file',
  version: '1.0.0',
  category: 'arch',
  severity: 'info',
  description: 'Detects files exporting multiple unrelated domain types',
  principle: 'One file, one concept — each file should export a single cohesive unit',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (BARREL_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    let hasReexport = false;
    const exportedTypes: { name: string; line: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (REEXPORT_RE.test(line.trimStart())) {
        hasReexport = true;
        continue;
      }
      const match = line.match(EXPORT_TYPE_RE);
      if (match) {
        exportedTypes.push({ name: match[1]!, line: i + 1 });
      }
    }

    if (hasReexport) return [];
    if (exportedTypes.length < 3) return [];

    const typeNames = new Set(exportedTypes.map(t => t.name));
    const related = new Set<string>();

    for (const t of exportedTypes) {
      for (const other of typeNames) {
        if (other === t.name) continue;
        const usageRe = new RegExp(`\\b${other}\\b`);
        const startLine = exportedTypes.find(e => e.name === t.name)!.line - 1;
        const nextType = exportedTypes.find(e => e.line > startLine + 1 && e.name !== t.name);
        const endLine = nextType ? nextType.line - 2 : lines.length;

        for (let i = startLine; i < endLine; i++) {
          if (usageRe.test(lines[i] ?? '')) {
            related.add(t.name);
            related.add(other);
            break;
          }
        }
      }
    }

    const unrelated = exportedTypes.filter(t => !related.has(t.name));
    if (unrelated.length < 3 && related.size > 0) return [];

    const count = exportedTypes.length;
    return [createFinding({
      rule_id: 'arch/multiple-concepts-per-file',
      file: file.path,
      line: exportedTypes[0]!.line,
      severity: 'info',
      message: `File exports ${count} unrelated types (${exportedTypes.map(t => t.name).join(', ')}). Split into separate files.`,
      source_principle: 'One file, one concept',
      category: 'arch',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex.multipleConceptsPerFile',
        query: { file: file.path },
        result: { exportedTypes: exportedTypes.map(t => t.name), count },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
