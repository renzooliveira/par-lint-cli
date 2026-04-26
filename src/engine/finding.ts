import { createHash } from 'node:crypto';
import type { Finding, Severity, FixComplexity } from '../types/finding.js';

export interface CreateFindingInput {
  rule_id: string;
  rule_version?: string;
  file: string;
  line: number;
  column?: number;
  end_line?: number;
  end_column?: number;
  severity: Severity;
  fix_complexity?: FixComplexity;
  message: string;
  source_principle: string;
  category: string;
  evidence_trail?: Finding['evidence_trail'];
  suggested_fix?: Finding['suggested_fix'];
}

export function createFindingId(ruleId: string, file: string, line: number, content?: string): string {
  const input = `${ruleId}::${file}::${line}::${content ?? ''}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export function createFinding(input: CreateFindingInput): Finding {
  const now = new Date().toISOString();
  return {
    finding_id: createFindingId(input.rule_id, input.file, input.line),
    rule_id: input.rule_id,
    rule_version: input.rule_version ?? '1.0.0',

    file: input.file,
    line: input.line,
    column: input.column,
    end_line: input.end_line,
    end_column: input.end_column,

    severity: input.severity,
    confidence: 1.0,
    confidence_band: 'confident_positive',
    fix_complexity: input.fix_complexity ?? 'S',

    message: input.message,

    evidence_trail: input.evidence_trail ?? [],

    suggested_fix: input.suggested_fix,

    source_principle: input.source_principle,
    source_realization: '',
    category: input.category,

    first_seen: now,
    last_seen: now,
    status: 'new',
  };
}
