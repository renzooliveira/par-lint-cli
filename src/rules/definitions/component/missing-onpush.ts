import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const COMPONENT_DECORATOR_RE = /@Component\s*\(\s*\{/;
const ONPUSH_RE = /changeDetection\s*:\s*ChangeDetectionStrategy\.OnPush/;

export const missingOnPushRule: RuleDefinition = {
  id: 'component/missing-onpush',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  description: 'Detects Angular components without OnPush change detection strategy',
  principle: 'Components should use OnPush for predictable and performant change detection',
  applicable_to: ['is_component'],

  async run(file, _config, cwd) {
    const source = await readSource(file.path, cwd);

    if (!COMPONENT_DECORATOR_RE.test(source)) return [];
    if (ONPUSH_RE.test(source)) return [];

    const lines = source.split('\n');
    const decoratorLine = lines.findIndex((l) => COMPONENT_DECORATOR_RE.test(l));

    return [createFinding({
      rule_id: 'component/missing-onpush',
      file: file.path,
      line: decoratorLine + 1,
      severity: 'warning',
      message: 'Component missing ChangeDetectionStrategy.OnPush. Add changeDetection: ChangeDetectionStrategy.OnPush.',
      source_principle: 'OnPush reduces unnecessary change detection cycles',
      category: 'component',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex',
        query: { file: file.path },
        result: { hasOnPush: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
