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
  by_fix_complexity: Record<string, number>;
  files_affected: number;
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
  maxTokens?: number;
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

function countBy(findings: Finding[], key: 'category' | 'severity' | 'fix_complexity'): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    const val = f[key];
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

const SEVERITY_RANK: Record<string, number> = { error: 0, warning: 1, info: 2, 'review-suggested': 3 };
const FIX_COMPLEXITY_RANK: Record<string, number> = { S: 0, M: 1, L: 2, XL: 3 };

export async function formatClaudeContext(report: Report, options?: ClaudeContextOptions): Promise<string> {
  const allFindings = [...report.findings].sort((a, b) => {
    const severityDiff = (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
    if (severityDiff !== 0) return severityDiff;
    return (FIX_COMPLEXITY_RANK[a.fix_complexity] ?? 9) - (FIX_COMPLEXITY_RANK[b.fix_complexity] ?? 9);
  });
  const maxIssues = options?.maxIssues;
  const issuesTruncated = maxIssues != null && maxIssues > 0 && allFindings.length > maxIssues;
  const sliced = issuesTruncated ? allFindings.slice(0, maxIssues) : allFindings;

  const fileCache = new Map<string, string[]>();
  const projectRoot = report.project.root;
  const rawIssuesAll = await Promise.all(
    sliced.map((f, i) => findingToIssue(f, i, projectRoot, fileCache)),
  );

  const maxTokens = options?.maxTokens;
  let keepCount = rawIssuesAll.length;
  if (maxTokens != null && maxTokens > 0 && rawIssuesAll.length > 0) {
    let acc = 0;
    keepCount = 0;
    for (const rawIssue of rawIssuesAll) {
      const tokens = Math.ceil(JSON.stringify(rawIssue).length / 4);
      if (keepCount === 0) {
        acc = tokens;
        keepCount = 1;
      } else if (acc + tokens <= maxTokens) {
        acc += tokens;
        keepCount++;
      } else {
        break;
      }
    }
  }
  const tokensTruncated = keepCount < rawIssuesAll.length;

  const rawIssues = tokensTruncated ? rawIssuesAll.slice(0, keepCount) : rawIssuesAll;
  const survivingFindings = tokensTruncated ? sliced.slice(0, keepCount) : sliced;
  const truncated = issuesTruncated || tokensTruncated;

  const scan: ClaudeContextScan = {
    files: report.performance.files_analyzed,
    issues: rawIssues.length,
    rules_v: report.par_lint_version,
    by_category: countBy(survivingFindings, 'category'),
    by_severity: countBy(survivingFindings, 'severity'),
    by_fix_complexity: countBy(survivingFindings, 'fix_complexity'),
    files_affected: new Set(survivingFindings.map(f => f.file)).size,
  };

  if (truncated) {
    scan.truncated = {
      total_issues: allFindings.length,
      total_by_category: countBy(allFindings, 'category'),
      total_by_severity: countBy(allFindings, 'severity'),
    };
  }

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
