import type { Report } from '../../types/report.js';
import type { Finding } from '../../types/finding.js';

interface ClaudeContextIssue {
  id: string;
  rule: string;
  loc: string;
  severity: string;
  evidence: string;
  principle: string;
  fix: {
    complexity: string;
    approach: string;
    example: string;
  };
  confidence: number;
}

interface ClaudeContextScan {
  files: number;
  issues: number;
  rules_v: string;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  truncated?: true;
}

interface ClaudeContextOutput {
  scan: ClaudeContextScan;
  issues: ClaudeContextIssue[];
}

export interface ClaudeContextOptions {
  maxIssues?: number;
}

function findingToIssue(finding: Finding, index: number): ClaudeContextIssue {
  return {
    id: `F${index + 1}`,
    rule: finding.rule_id,
    loc: `${finding.file}:${finding.line}`,
    severity: finding.severity,
    evidence: finding.message,
    principle: finding.source_principle,
    fix: {
      complexity: finding.fix_complexity,
      approach: finding.suggested_fix?.description ?? '',
      example: finding.suggested_fix?.diff ?? '',
    },
    confidence: finding.confidence,
  };
}

function countBy(findings: Finding[], key: 'category' | 'severity'): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    const val = key === 'category' ? f.category : f.severity;
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

const SEVERITY_RANK: Record<string, number> = { error: 0, warning: 1, info: 2, 'review-suggested': 3 };

export function formatClaudeContext(report: Report, options?: ClaudeContextOptions): string {
  const allFindings = [...report.findings].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
  );
  const maxIssues = options?.maxIssues;
  const truncated = maxIssues != null && maxIssues > 0 && allFindings.length > maxIssues;
  const sliced = truncated ? allFindings.slice(0, maxIssues) : allFindings;

  const scan: ClaudeContextScan = {
    files: report.performance.files_analyzed,
    issues: allFindings.length,
    rules_v: report.par_lint_version,
    by_category: countBy(allFindings, 'category'),
    by_severity: countBy(allFindings, 'severity'),
  };

  if (truncated) {
    scan.truncated = true;
  }

  const output: ClaudeContextOutput = {
    scan,
    issues: sliced.map(findingToIssue),
  };

  return JSON.stringify(output);
}
