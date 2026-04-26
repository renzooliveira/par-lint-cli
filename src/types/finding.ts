export type Severity = 'info' | 'warning' | 'error' | 'review-suggested';
export type ConfidenceBand = 'confident_negative' | 'uncertain' | 'confident_positive';
export type FixComplexity = 'S' | 'M' | 'L' | 'XL';
export type FindingStatus = 'new' | 'persistent' | 'resolved' | 'stale';
export type SuppressionScope = 'line' | 'file' | 'rule_in_file';
export type SuppressionSource = 'inline_comment' | 'config_file' | 'cli_flag';

export interface EvidenceItem {
  tool: string;
  query: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: string;
  cache_hit: boolean;
}

export interface SuggestedFix {
  kind: 'replace' | 'extract_method' | 'move_method' | 'rename' | 'add_validation' | 'manual';
  description: string;
  diff?: string;
  references?: Array<{ file: string; line: number; reason: string }>;
}

export interface Suppression {
  reason: string;
  author: string;
  date: string;
  scope: SuppressionScope;
  source: SuppressionSource;
}

export interface Finding {
  finding_id: string;
  rule_id: string;
  rule_version: string;

  file: string;
  line: number;
  column?: number;
  end_line?: number;
  end_column?: number;

  severity: Severity;
  confidence: number;
  confidence_band: ConfidenceBand;
  fix_complexity: FixComplexity;

  message: string;
  reasoning?: string;

  evidence_trail: EvidenceItem[];

  suggested_fix?: SuggestedFix;

  source_principle: string;
  source_realization: string;
  category: string;

  first_seen: string;
  last_seen: string;
  status: FindingStatus;
  suppression?: Suppression;

  churn_weight?: number;
  test_coverage?: number;
}
