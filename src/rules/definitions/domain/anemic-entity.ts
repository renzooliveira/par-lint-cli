import type { RuleDefinition } from '../../../engine/runner.js';
import { extractFunctions } from '../../../adapters/ts-metrics.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PROPERTY_RE = /^\s*(?:public\s+|readonly\s+|private\s+|protected\s+)*(\w+)\s*(?:\??\s*:\s*\S+)?\s*=\s*[^(]/gm;
const CLASS_RE = /\bclass\s+(\w+)/;

export const anemicEntityRule: RuleDefinition = {
  id: 'domain/anemic-entity',
  version: '1.0.0',
  category: 'domain',
  severity: 'warning',
  description: 'Detects entities with many properties but few methods (data bags)',
  principle: 'Rich entities encapsulate behavior, not just data',
  applicable_to: ['is_entity', 'is_model'],

  async run(file, config, cwd) {
    const opts = config.rules['domain/anemic-entity']?.options as {
      minProperties?: number;
      minMethodRatio?: number;
    } | undefined;
    const minProperties = opts?.minProperties ?? 5;
    const minMethodRatio = opts?.minMethodRatio ?? 0.2;

    const source = await readSource(file.path, cwd);
    const classMatch = CLASS_RE.exec(source);
    if (!classMatch) return [];

    const className = classMatch[1]!;
    const functions = extractFunctions(source);
    const methodCount = functions.filter((f) =>
      f.name !== 'constructor' && f.name !== className
    ).length;

    PROPERTY_RE.lastIndex = 0;
    let propCount = 0;
    while (PROPERTY_RE.exec(source) !== null) propCount++;

    if (propCount < minProperties) return [];

    const ratio = methodCount / propCount;
    if (ratio >= minMethodRatio) return [];

    return [createFinding({
      rule_id: 'domain/anemic-entity',
      file: file.path,
      line: 1,
      severity: 'warning',
      message: `Anemic entity '${className}': ${propCount} properties but only ${methodCount} methods (ratio ${ratio.toFixed(2)}, min ${minMethodRatio}). Add behavior.`,
      source_principle: 'Rich entities encapsulate behavior, not just data',
      category: 'domain',
      fix_complexity: 'L',
      suggested_fix: {
        kind: 'move_method',
        description: `Add behavior to '${className}': move related logic from services into this entity`,
      },
      evidence_trail: [{
        tool: 'ts-metrics + regex',
        query: { file: file.path },
        result: { className, propCount, methodCount, ratio },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
