import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SUBMIT_HANDLER_RE = /\(ngSubmit\)\s*=\s*"([^"]+)"/;
const SUBMIT_BUTTON_RE = /type\s*=\s*"submit"/;
const DISABLE_PATTERNS = [
  /\[disabled\]\s*=\s*"/,
  /isSubmitting/i,
  /submitting/i,
  /form\.disable\(\)/,
  /\[attr\.disabled\]/,
  /ion-spinner/i,
  /loading/i,
];

export const formNotDisabledDuringSubmitRule: RuleDefinition = {
  id: 'ux/form-not-disabled-during-submit',
  version: '1.0.0',
  category: 'ux',
  severity: 'warning',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);

    const hasSubmitHandler = SUBMIT_HANDLER_RE.test(source);
    const hasSubmitButton = SUBMIT_BUTTON_RE.test(source);
    if (!hasSubmitHandler && !hasSubmitButton) return [];

    const hasDisablePattern = DISABLE_PATTERNS.some((p) => p.test(source));
    if (hasDisablePattern) return [];

    const lines = source.split('\n');
    let submitLine = 1;
    for (let i = 0; i < lines.length; i++) {
      if (/ngSubmit|type\s*=\s*"submit"/.test(lines[i]!)) {
        submitLine = i + 1;
        break;
      }
    }

    return [createFinding({
      rule_id: 'ux/form-not-disabled-during-submit',
      file: file.path,
      line: submitLine,
      severity: 'warning',
      message: 'Form submit handler without disable pattern. Prevent double submission with [disabled]="isSubmitting()" or form.disable().',
      source_principle: 'Forms must prevent double submission during async operations',
      category: 'ux',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex',
        query: { file: file.path },
        result: { hasSubmit: true, hasDisable: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
