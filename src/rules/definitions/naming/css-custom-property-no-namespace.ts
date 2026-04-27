import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CUSTOM_PROP_DECL_RE = /^\s*(--[a-zA-Z][a-zA-Z0-9-]*)\s*:/;
const DEFAULT_LIB_PREFIXES = ['--ion-', '--mat-', '--cdk-', '--mdc-'];

export const cssCustomPropertyNoNamespaceRule: RuleDefinition = {
  id: 'naming/css-custom-property-no-namespace',
  version: '1.0.0',
  category: 'naming',
  severity: 'info',
  description: 'Detects CSS custom properties without design system namespace prefix',
  principle: 'Custom properties have namespace to avoid collisions',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const opts = config.rules['naming/css-custom-property-no-namespace']?.options as {
      prefix?: string;
      libPrefixes?: string[];
    } | undefined;
    const prefix = opts?.prefix ?? 'par';
    const libPrefixes = opts?.libPrefixes ?? DEFAULT_LIB_PREFIXES;
    const requiredPrefix = `--${prefix}-`;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = CUSTOM_PROP_DECL_RE.exec(line);
      if (!match) continue;

      const prop = match[1]!;
      if (prop.startsWith(requiredPrefix)) continue;
      if (libPrefixes.some((lp) => prop.startsWith(lp))) continue;

      findings.push(createFinding({
        rule_id: 'naming/css-custom-property-no-namespace',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Custom property "${prop}" missing namespace prefix "${requiredPrefix}"`,
        source_principle: 'Custom properties use design system namespace',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'namespace prefix', file: file.path },
          result: { line: i + 1, prop, requiredPrefix },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
