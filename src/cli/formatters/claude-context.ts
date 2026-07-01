import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Report } from '../../types/report.js';
import type { Finding } from '../../types/finding.js';

interface ClaudeContextIssue {
  id: string;
  rule: string;
  loc: string;
  severity: string;
  snippet: string;
  evidence: string;
  principle: string;
  fix: {
    complexity: string;
    approach: string;
    example: string;
  };
  confidence: number;
  status: string;
}

interface ClaudeContextOccurrence {
  line: number;
  snippet: string;
  evidence: string;
  status: string;
}

interface ClaudeContextGroupedIssue {
  id: string;
  rule: string;
  file: string;
  severity: string;
  principle: string;
  fix: {
    complexity: string;
    approach: string;
    example: string;
  };
  confidence: number;
  occurrences: ClaudeContextOccurrence[];
}

interface ClaudeContextScan {
  files: number;
  issues: number;
  rules_v: string;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  truncated?: {
    total_issues: number;
    total_by_category: Record<string, number>;
    total_by_severity: Record<string, number>;
  };
}

interface ClaudeContextOutput {
  scan: ClaudeContextScan;
  issues: (ClaudeContextIssue | ClaudeContextGroupedIssue)[];
}

export interface ClaudeContextOptions {
  maxIssues?: number;
}

async function extractSnippet(
  filePath: string,
  line: number,
  projectRoot: string,
  fileCache: Map<string, string[]>,
): Promise<string> {
  try {
    let lines = fileCache.get(filePath);
    if (!lines) {
      const content = await readFile(path.resolve(projectRoot, filePath), 'utf-8');
      lines = content.split('\n');
      fileCache.set(filePath, lines);
    }
    const start = Math.max(0, line - 3);
    const end = Math.min(lines.length, line + 2);
    return lines
      .slice(start, end)
      .map((text, i) => {
        const lineNum = start + i + 1;
        const marker = lineNum === line ? '>' : '|';
        return `${lineNum}${marker} ${text}`;
      })
      .join('\n');
  } catch {
    return '';
  }
}

async function findingToIssue(
  finding: Finding,
  index: number,
  projectRoot: string,
  fileCache: Map<string, string[]>,
): Promise<ClaudeContextIssue> {
  const snippet = await extractSnippet(finding.file, finding.line, projectRoot, fileCache);
  return {
    id: `F${index + 1}`,
    rule: finding.rule_id,
    loc: `${finding.file}:${finding.line}`,
    severity: finding.severity,
    snippet,
    evidence: finding.message,
    principle: finding.source_principle,
    fix: {
      complexity: finding.fix_complexity,
      approach: finding.suggested_fix?.description ?? '',
      example: finding.suggested_fix?.diff ?? '',
    },
    confidence: finding.confidence,
    status: finding.status,
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

export async function formatClaudeContext(report: Report, options?: ClaudeContextOptions): Promise<string> {
  const allFindings = [...report.findings].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
  );
  const maxIssues = options?.maxIssues;
  const truncated = maxIssues != null && maxIssues > 0 && allFindings.length > maxIssues;
  const sliced = truncated ? allFindings.slice(0, maxIssues) : allFindings;

  const scan: ClaudeContextScan = {
    files: report.performance.files_analyzed,
    issues: sliced.length,
    rules_v: report.par_lint_version,
    by_category: countBy(sliced, 'category'),
    by_severity: countBy(sliced, 'severity'),
  };

  if (truncated) {
    scan.truncated = {
      total_issues: allFindings.length,
      total_by_category: countBy(allFindings, 'category'),
      total_by_severity: countBy(allFindings, 'severity'),
    };
  }

  const fileCache = new Map<string, string[]>();
  const projectRoot = report.project.root;
  const rawIssues = await Promise.all(
    sliced.map((f, i) => findingToIssue(f, i, projectRoot, fileCache)),
  );

  const groupMap = new Map<string, ClaudeContextIssue[]>();
  for (const issue of rawIssues) {
    const file = issue.loc.split(':').slice(0, -1).join(':');
    const key = `${file}|${issue.rule}`;
    const group = groupMap.get(key);
    if (group) group.push(issue);
    else groupMap.set(key, [issue]);
  }

  const issues: (ClaudeContextIssue | ClaudeContextGroupedIssue)[] = [];
  let fIdx = 0;
  let gIdx = 0;
  for (const group of groupMap.values()) {
    if (group.length === 1) {
      group[0].id = `F${++fIdx}`;
      issues.push(group[0]);
    } else {
      const first = group[0];
      const file = first.loc.split(':').slice(0, -1).join(':');
      issues.push({
        id: `G${++gIdx}`,
        rule: first.rule,
        file,
        severity: first.severity,
        principle: first.principle,
        fix: first.fix,
        confidence: Math.min(...group.map(g => g.confidence)),
        occurrences: group.map(g => ({
          line: parseInt(g.loc.split(':').pop()!, 10),
          snippet: g.snippet,
          evidence: g.evidence,
          status: g.status,
        })),
      });
    }
  }

  const output: ClaudeContextOutput = {
    scan,
    issues,
  };

  return JSON.stringify(output);
}
