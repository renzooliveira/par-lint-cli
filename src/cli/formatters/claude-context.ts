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

interface ClaudeContextOutput {
  scan: {
    files: number;
    issues: number;
    rules_v: string;
  };
  issues: ClaudeContextIssue[];
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

export function formatClaudeContext(report: Report): string {
  const output: ClaudeContextOutput = {
    scan: {
      files: report.performance.files_analyzed,
      issues: report.findings.length,
      rules_v: report.par_lint_version,
    },
    issues: report.findings.map(findingToIssue),
  };

  return JSON.stringify(output);
}
