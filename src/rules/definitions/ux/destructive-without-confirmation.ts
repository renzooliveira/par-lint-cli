import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const DESTRUCTIVE_METHOD_RE = /^\s*(?:async\s+)?(?:public\s+|private\s+|protected\s+)?(delete\w*|remove\w*|destroy\w*)\s*\(/gm;
const CONFIRM_RE = /confirm|AlertController|MatDialog|IonAlert|showAlert|openConfirm/;

export const destructiveWithoutConfirmationRule: RuleDefinition = {
  id: 'ux/destructive-without-confirmation',
  version: '1.0.0',
  category: 'ux',
  severity: 'error',
  description: 'Detects delete/remove/destroy handlers without confirmation dialog',
  principle: 'Destructive actions require explicit user confirmation before execution',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    DESTRUCTIVE_METHOD_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DESTRUCTIVE_METHOD_RE.exec(source)) !== null) {
      const methodName = match[1]!;
      const methodStart = source.substring(0, match.index).split('\n').length;

      let braceDepth = 0;
      let methodBody = '';
      let started = false;
      for (let i = methodStart - 1; i < lines.length; i++) {
        const line = lines[i]!;
        braceDepth += (line.match(/{/g) ?? []).length;
        braceDepth -= (line.match(/}/g) ?? []).length;
        if (braceDepth > 0) started = true;
        methodBody += line + '\n';
        if (started && braceDepth <= 0) break;
      }

      if (!CONFIRM_RE.test(methodBody)) {
        findings.push(createFinding({
          rule_id: 'ux/destructive-without-confirmation',
          file: file.path,
          line: methodStart,
          severity: 'error',
          message: `Destructive method '${methodName}' without confirmation dialog. Add confirmation before executing.`,
          source_principle: 'Destructive actions require explicit user confirmation',
          category: 'ux',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { method: methodName, hasConfirm: false },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
