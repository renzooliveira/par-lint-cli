import chalk from 'chalk';
import type { Report } from '../../types/report.js';
import type { Finding } from '../../types/finding.js';

const SEVERITY_COLORS = {
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  'review-suggested': chalk.magenta,
} as const;

const SEVERITY_ICONS = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
  'review-suggested': '?',
} as const;

function formatFinding(finding: Finding): string {
  const color = SEVERITY_COLORS[finding.severity];
  const icon = SEVERITY_ICONS[finding.severity];
  const location = `${finding.file}:${finding.line}${finding.column ? `:${finding.column}` : ''}`;

  return `  ${color(icon)} ${chalk.dim(location)} ${finding.message} ${chalk.dim(`[${finding.rule_id}]`)}`;
}

export function formatConsole(report: Report): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold(`par-lint report — ${report.project.name}`));
  lines.push(chalk.dim(`${report.timestamp} · ${report.performance.files_analyzed} files · ${report.performance.total_duration_ms}ms`));
  lines.push('');

  if (report.findings.length === 0) {
    lines.push(chalk.green('  ✔ No findings.'));
    lines.push('');
    return lines.join('\n');
  }

  const grouped = groupBy(report.findings, (f) => f.category);

  for (const [category, findings] of Object.entries(grouped)) {
    lines.push(chalk.bold.underline(`  ${category}`));
    for (const finding of findings) {
      lines.push(formatFinding(finding));
    }
    lines.push('');
  }

  const { summary } = report;
  const parts: string[] = [];
  if (summary.by_severity['error']) parts.push(chalk.red(`${summary.by_severity['error']} errors`));
  if (summary.by_severity['warning']) parts.push(chalk.yellow(`${summary.by_severity['warning']} warnings`));
  if (summary.by_severity['info']) parts.push(chalk.blue(`${summary.by_severity['info']} info`));

  lines.push(`  ${chalk.bold('Total:')} ${summary.total_findings} findings (${parts.join(', ')})`);
  lines.push('');

  return lines.join('\n');
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}
