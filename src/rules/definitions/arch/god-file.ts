import type { RuleDefinition } from '../../../engine/runner.js';
import { analyzeFile } from '../../../adapters/ts-metrics.js';
import { createFinding } from '../../../engine/finding.js';

export const godFileRule: RuleDefinition = {
  id: 'arch/god-file',
  version: '1.0.0',
  category: 'arch',
  severity: 'warning',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['arch/god-file']?.options as {
      maxLines?: number;
      maxFunctions?: number;
      maxFunctionsService?: number;
      maxFunctionsComponent?: number;
      maxExports?: number;
    } | undefined;

    const maxLines = opts?.maxLines ?? 400;
    const isService = file.tags.includes('is_service');
    const isComponent = file.tags.includes('is_component');
    const maxFunctions = (isService ? opts?.maxFunctionsService : isComponent ? opts?.maxFunctionsComponent : undefined)
      ?? opts?.maxFunctions ?? (isService ? 25 : isComponent ? 15 : 20);
    const maxExports = opts?.maxExports ?? 15;

    const metrics = await analyzeFile(file.path, cwd);
    const findings = [];

    if (metrics.lineCount > maxLines) {
      findings.push(createFinding({
        rule_id: 'arch/god-file',
        file: file.path,
        line: 1,
        severity: 'warning',
        message: `God file: ${metrics.lineCount} lines exceeds max ${maxLines}. Split responsibilities.`,
        source_principle: 'Single file should not accumulate multiple responsibilities',
        category: 'arch',
        fix_complexity: 'L',
        evidence_trail: [{
          tool: 'ts-metrics.analyzeFile',
          query: { file: file.path },
          result: { lineCount: metrics.lineCount, maxLines },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    if (metrics.functionCount > maxFunctions) {
      findings.push(createFinding({
        rule_id: 'arch/god-file',
        file: file.path,
        line: 1,
        severity: 'warning',
        message: `God file: ${metrics.functionCount} functions exceeds max ${maxFunctions}.`,
        source_principle: 'Too many functions in one file indicates mixed responsibilities',
        category: 'arch',
        fix_complexity: 'L',
        evidence_trail: [{
          tool: 'ts-metrics.analyzeFile',
          query: { file: file.path },
          result: { functionCount: metrics.functionCount, maxFunctions },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    if (metrics.exportCount > maxExports) {
      findings.push(createFinding({
        rule_id: 'arch/god-file',
        file: file.path,
        line: 1,
        severity: 'warning',
        message: `God file: ${metrics.exportCount} exports exceeds max ${maxExports}.`,
        source_principle: 'Too many exports indicates file is a grab-bag module',
        category: 'arch',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'ts-metrics.analyzeFile',
          query: { file: file.path },
          result: { exportCount: metrics.exportCount, maxExports },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
