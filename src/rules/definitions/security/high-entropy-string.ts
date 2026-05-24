import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

function shannonEntropy(s: string): number {
  const freq = new Map<string, number>();
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1);
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export const highEntropyStringRule: RuleDefinition = {
  id: 'security/high-entropy-string',
  version: '1.0.0',
  category: 'security',
  severity: 'error',
  description: 'Detects high-entropy strings that may be secrets or API keys',
  principle: 'Secrets should be in environment variables, not source code',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^\s*\/\//.test(line) || /import\s/.test(line)) continue;

      const strings = line.match(/['"`]([A-Za-z0-9+/=_-]{20,})['"`]/g);
      if (!strings) continue;

      for (const str of strings) {
        const content = str.slice(1, -1);
        if (/^https?:\/\//.test(content)) continue;
        if (/^[a-z]+([A-Z][a-z]+)+$/.test(content)) continue;
        if (/\//.test(content)) continue;
        if (/\\[dswDSWbB(.+]|\\\\/.test(content)) continue;
        if (/new\s+RegExp|RegExp\(/.test(line)) continue;

        const entropy = shannonEntropy(content);
        if (entropy > 4.0 && content.length >= 20) {
          findings.push(createFinding({
            rule_id: 'security/high-entropy-string',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: `High-entropy string detected (entropy: ${entropy.toFixed(1)}). Possible hardcoded secret.`,
            source_principle: 'Secrets belong in environment variables, not source code',
            category: 'security',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.highEntropy',
              query: { file: file.path },
              result: { line: i + 1, entropy: entropy.toFixed(1), length: content.length },
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
