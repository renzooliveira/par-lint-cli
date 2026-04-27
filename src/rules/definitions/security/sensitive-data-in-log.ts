import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SENSITIVE_PATTERNS = /\b(password|passwd|secret|token|apiKey|api_key|authorization|credential|private_key|privateKey)\b/i;

export const sensitiveDataInLogRule: RuleDefinition = {
  id: 'security/sensitive-data-in-log',
  version: '1.0.0',
  category: 'security',
  severity: 'error',
  description: 'Detects logging of sensitive data like passwords and tokens',
  principle: 'Sensitive data in logs can be exposed via log aggregation systems',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/console\.(log|debug|info|warn|error)\s*\(/.test(line) && SENSITIVE_PATTERNS.test(line)) {
        const match = line.match(SENSITIVE_PATTERNS);
        findings.push(createFinding({
          rule_id: 'security/sensitive-data-in-log',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: `Sensitive data "${match?.[0]}" found in console output. Remove or mask sensitive values.`,
          source_principle: 'Never log credentials, tokens, or secrets',
          category: 'security',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.sensitiveLog',
            query: { file: file.path },
            result: { line: i + 1, keyword: match?.[0] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
