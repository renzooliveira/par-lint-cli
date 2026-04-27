import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SECRET_VAR_RE = /\b(api[_-]?key|apikey|secret|password|passwd|token|auth[_-]?token|private[_-]?key|access[_-]?key|client[_-]?secret)\b/i;
const ASSIGNMENT_RE = /(?:=\s*['"`])([^'"`]{8,})['"`]/;
const ENV_RE = /process\.env|import\.meta\.env|environment\./;

export const hardcodedSecretRule: RuleDefinition = {
  id: 'security/hardcoded-secret',
  version: '1.0.0',
  category: 'security',
  severity: 'error',
  description: 'Detects hardcoded secrets, API keys, and passwords in source code',
  principle: 'Secrets must come from environment variables or secret managers, never hardcoded',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (/\.env\.|environment\.(ts|js)/.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      const varMatch = line.match(SECRET_VAR_RE);
      if (!varMatch) continue;

      if (ENV_RE.test(line)) continue;

      const assignMatch = line.match(ASSIGNMENT_RE);
      if (!assignMatch) continue;

      findings.push(createFinding({
        rule_id: 'security/hardcoded-secret',
        file: file.path,
        line: i + 1,
        severity: 'error',
        message: `Hardcoded secret in variable matching '${varMatch[0]}'. Use environment variables or a secret manager.`,
        source_principle: 'Secrets must come from environment variables or secret managers',
        category: 'security',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.hardcodedSecret',
          query: { file: file.path },
          result: { line: i + 1, variable: varMatch[0] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
