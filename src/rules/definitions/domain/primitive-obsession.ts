import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PRIMITIVES = /\b(string|number|boolean)\b/g;
const METHOD_RE = /(?:function\s+\w+|(?:async\s+)?\w+)\s*\(([^)]{20,})\)/g;
const MIN_PRIMITIVE_PARAMS = 4;

export const primitiveObsessionRule: RuleDefinition = {
  id: 'domain/primitive-obsession',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  applicable_to: ['is_typescript', 'is_service', 'is_component'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      METHOD_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = METHOD_RE.exec(line)) !== null) {
        const params = match[1]!;
        const primitiveCount = (params.match(PRIMITIVES) ?? []).length;
        if (primitiveCount >= MIN_PRIMITIVE_PARAMS) {
          findings.push(createFinding({
            rule_id: 'domain/primitive-obsession',
            file: file.path,
            line: i + 1,
            column: match.index + 1,
            severity: 'info',
            message: `Function has ${primitiveCount} primitive parameters. Consider grouping into a value object or DTO.`,
            source_principle: 'Domain concepts deserve dedicated types instead of raw primitives',
            category: 'domain',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex',
              query: { file: file.path },
              result: { line: i + 1, primitiveCount },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
