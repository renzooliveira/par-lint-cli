import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const excessiveInputOutputRule: RuleDefinition = {
  id: 'component/excessive-input-output',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects components with too many @Input/@Output declarations',
  principle: 'Large component surface area indicates multiple responsibilities',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const opts = config.rules['component/excessive-input-output']?.options as {
      maxInputs?: number;
      maxOutputs?: number;
    } | undefined;
    const maxInputs = opts?.maxInputs ?? 8;
    const maxOutputs = opts?.maxOutputs ?? 6;

    const source = await readSource(file.path, cwd);

    const inputCount = (source.match(/@Input\s*\(/g) ?? []).length
      + (source.match(/\binput\s*[<(]/g) ?? []).length
      + (source.match(/\binput\.required\s*[<(]/g) ?? []).length;

    const outputCount = (source.match(/@Output\s*\(/g) ?? []).length
      + (source.match(/\boutput\s*[<(]/g) ?? []).length;

    const findings = [];

    if (inputCount > maxInputs) {
      findings.push(createFinding({
        rule_id: 'component/excessive-input-output',
        file: file.path,
        line: 1,
        severity: 'info',
        message: `Excessive inputs: ${inputCount} exceeds max ${maxInputs}. Consider a config object or splitting the component.`,
        source_principle: 'Too many inputs indicate the component has too many responsibilities',
        category: 'component',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.inputCount',
          query: { file: file.path },
          result: { inputCount, maxInputs },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    if (outputCount > maxOutputs) {
      findings.push(createFinding({
        rule_id: 'component/excessive-input-output',
        file: file.path,
        line: 1,
        severity: 'info',
        message: `Excessive outputs: ${outputCount} exceeds max ${maxOutputs}. Consider event aggregation or splitting the component.`,
        source_principle: 'Too many outputs indicate the component is doing too much',
        category: 'component',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.outputCount',
          query: { file: file.path },
          result: { outputCount, maxOutputs },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
