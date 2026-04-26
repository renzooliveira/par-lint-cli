import type { Finding } from './finding.js';

export interface ReportSummary {
  total_findings: number;
  by_severity: Record<string, number>;
  by_category: Record<string, number>;
  by_confidence_band: Record<string, number>;
  by_status: Record<string, number>;
}

export interface ReportDiff {
  new_findings: string[];
  resolved_findings: string[];
  persistent_findings: string[];
  stale_findings: string[];
}

export interface ReportPerformance {
  total_duration_ms: number;
  by_tool: Record<string, number>;
  cache_hit_rate: number;
  files_analyzed: number;
}

export interface Report {
  report_id: string;
  schema_version: string;
  par_lint_version: string;
  timestamp: string;

  project: {
    name: string;
    root: string;
    git_sha: string;
    git_branch: string;
  };

  summary: ReportSummary;
  findings: Finding[];
  diff: ReportDiff;
  performance: ReportPerformance;
}
