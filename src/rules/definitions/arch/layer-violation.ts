import type { RuleDefinition } from '../../../engine/runner.js';
import { extractImports, checkLayerViolation } from '../../../adapters/dependency-cruiser.js';
import { createFinding } from '../../../engine/finding.js';

export const layerViolationRule: RuleDefinition = {
  id: 'arch/layer-violation',
  version: '1.0.0',
  category: 'arch',
  severity: 'error',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const imports = await extractImports(file.path, cwd);
    const findings = [];

    for (const imp of imports) {
      const violation = checkLayerViolation(file.path, imp.to, imp.line, imp.rawImport);
      if (violation) {
        findings.push(createFinding({
          rule_id: 'arch/layer-violation',
          file: file.path,
          line: imp.line,
          severity: 'error',
          message: `Layer violation: ${violation.fromLayer} → ${violation.toLayer}. '${violation.fromLayer}' must not import from '${violation.toLayer}'.`,
          source_principle: 'Lower layers must not depend on higher layers',
          category: 'arch',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'dependency-cruiser.checkLayerViolation',
            query: { file: file.path, import: imp.to },
            result: { fromLayer: violation.fromLayer, toLayer: violation.toLayer },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
