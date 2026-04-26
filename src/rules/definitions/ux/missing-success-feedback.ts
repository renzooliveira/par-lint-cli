import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const MUTATION_CALL_RE = /\.(post|put|patch|delete)\s*\(/;
const SUBSCRIBE_RE = /\.subscribe\s*\(/;
const SUCCESS_FEEDBACK_RE = /toast|snackbar|alert|notification|showSuccess|presentToast|showMessage/i;

export const missingSuccessFeedbackRule: RuleDefinition = {
  id: 'ux/missing-success-feedback',
  version: '1.0.0',
  category: 'ux',
  severity: 'warning',
  description: 'Detects mutation handlers (POST/PUT/DELETE) without success feedback',
  principle: 'Confirmed mutations must communicate success to the user',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.tags.includes('is_component') && !file.tags.includes('is_page')) return [];

    const source = await readSource(file.path, cwd);

    if (!MUTATION_CALL_RE.test(source)) return [];
    if (!SUBSCRIBE_RE.test(source)) return [];
    if (SUCCESS_FEEDBACK_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (MUTATION_CALL_RE.test(line)) {
        findings.push(createFinding({
          rule_id: 'ux/missing-success-feedback',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Mutation call without success feedback. Add toast/snackbar/alert after successful operation.',
          source_principle: 'Confirmed mutations should be communicated to the user',
          category: 'ux',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { line: i + 1, hasSuccessFeedback: false },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
