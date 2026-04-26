import type { Report } from '../../types/report.js';
import type { Finding } from '../../types/finding.js';

function severityBadge(severity: string): string {
  switch (severity) {
    case 'error': return '🔴';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    default: return '⚪';
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'new': return '🆕';
    case 'persistent': return '🔄';
    case 'resolved': return '✅';
    default: return '⬜';
  }
}

function findingRow(f: Finding): string {
  const location = `\`${f.file}:${f.line}\``;
  return `| ${severityBadge(f.severity)} ${f.severity} | ${statusBadge(f.status)} ${f.status} | ${location} | ${f.message} | \`${f.rule_id}\` |`;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

export function formatMarkdown(report: Report): string {
  const lines: string[] = [];

  lines.push(`# par-lint Report — ${report.project.name}`);
  lines.push('');
  lines.push(`> Generated: ${report.timestamp}  `);
  lines.push(`> Files analyzed: ${report.performance.files_analyzed}  `);
  lines.push(`> Duration: ${report.performance.total_duration_ms}ms`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total findings | ${report.summary.total_findings} |`);

  for (const [sev, count] of Object.entries(report.summary.by_severity)) {
    lines.push(`| ${severityBadge(sev)} ${sev} | ${count} |`);
  }

  if (report.diff.new_findings.length > 0) {
    lines.push(`| 🆕 New | ${report.diff.new_findings.length} |`);
  }
  if (report.diff.resolved_findings.length > 0) {
    lines.push(`| ✅ Resolved | ${report.diff.resolved_findings.length} |`);
  }

  lines.push('');

  if (report.findings.length === 0) {
    lines.push('**No findings.** ✅');
    return lines.join('\n');
  }

  lines.push('## Findings');
  lines.push('');

  const grouped = groupBy(report.findings, (f) => f.category);

  for (const [category, findings] of Object.entries(grouped)) {
    lines.push(`### ${category}`);
    lines.push('');
    lines.push('| Severity | Status | Location | Message | Rule |');
    lines.push('|----------|--------|----------|---------|------|');
    for (const finding of findings) {
      lines.push(findingRow(finding));
    }
    lines.push('');
  }

  return lines.join('\n');
}
