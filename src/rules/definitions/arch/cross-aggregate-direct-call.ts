import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const AGGREGATE_FILE_RE = /\.aggregate\.ts$/;
const AGGREGATE_CLASS_RE = /export\s+class\s+(\w*Aggregate\w*)/;
const IMPORT_AGGREGATE_RE = /import\s+\{[^}]*\b(\w*Aggregate\w*)\b[^}]*\}\s+from\s+['"]([^'"]+)['"]/g;

export const crossAggregateDirectCallRule: RuleDefinition = {
  id: 'arch/cross-aggregate-direct-call',
  version: '1.0.0',
  category: 'arch',
  severity: 'info',
  description: 'Detects aggregate roots directly calling methods on other aggregates',
  principle: 'Cross-aggregate communication should use events, not direct method calls',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!AGGREGATE_FILE_RE.test(file.path)) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);

    const selfMatch = source.match(AGGREGATE_CLASS_RE);
    const selfName = selfMatch?.[1] ?? '';

    const findings: ReturnType<typeof createFinding>[] = [];
    let match: RegExpExecArray | null;
    const importRe = new RegExp(IMPORT_AGGREGATE_RE.source, 'g');

    while ((match = importRe.exec(source)) !== null) {
      const importedAggregate = match[1]!;
      const importPath = match[2]!;

      if (importedAggregate === selfName) continue;

      const importLine = source.slice(0, match.index).split('\n').length;

      findings.push(createFinding({
        rule_id: 'arch/cross-aggregate-direct-call',
        file: file.path,
        line: importLine,
        severity: 'info',
        message: `Aggregate imports '${importedAggregate}' from '${importPath}'. Use domain events instead of direct cross-aggregate calls.`,
        source_principle: 'Cross-aggregate communication should use events',
        category: 'arch',
        fix_complexity: 'L',
        evidence_trail: [{
          tool: 'regex.crossAggregateDirectCall',
          query: { file: file.path },
          result: { selfAggregate: selfName, importedAggregate, importPath },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
