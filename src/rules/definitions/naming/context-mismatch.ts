import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CLASS_DECL_RE = /^\s*(?:export\s+)?(?:abstract\s+)?(?:class|interface|type|enum)\s+(\w+)/;
const FEATURE_DIR_RE = /features\/([^/]+)\//;

function kebabToPascal(kebab: string): string {
  return kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

export const contextMismatchRule: RuleDefinition = {
  id: 'naming/context-mismatch',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects generic artifact names in feature directories that should include context prefix',
  principle: 'Artifacts in feature directories should include the feature name for disambiguation',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const featureMatch = file.path.match(FEATURE_DIR_RE);
    if (!featureMatch) return [];

    const featureName = featureMatch[1]!;
    const featurePrefix = kebabToPascal(featureName);

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    const genericNames = new Set(['Item', 'Detail', 'List', 'Form', 'Dialog', 'Modal', 'Card', 'Table', 'Row', 'Config', 'Options', 'Settings', 'Data', 'State', 'Params', 'Response', 'Request', 'Attachment', 'Comment', 'Status', 'Type', 'Filter', 'Sort']);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(CLASS_DECL_RE);
      if (!match) continue;

      const name = match[1]!;
      if (name.startsWith(featurePrefix)) continue;

      if (genericNames.has(name)) {
        findings.push(createFinding({
          rule_id: 'naming/context-mismatch',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `Generic name '${name}' in feature '${featureName}'. Consider '${featurePrefix}${name}' for clarity.`,
          source_principle: 'Artifacts in feature directories should include the feature name',
          category: 'naming',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.contextMismatch',
            query: { file: file.path },
            result: { name, feature: featureName, suggested: `${featurePrefix}${name}` },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
