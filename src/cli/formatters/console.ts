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

  lines.push(...formatTopOffenders(report.findings));

  const grouped = groupBy(report.findings, (f) => f.category);

  for (const [category, findings] of Object.entries(grouped)) {
    lines.push(chalk.bold.underline(`  ${category}`));
    for (const finding of findings) {
      lines.push(formatFinding(finding));
    }
    lines.push('');
  }

  lines.push(...formatSummaryTable(report));

  const { summary } = report;
  const parts: string[] = [];
  if (summary.by_severity['error']) parts.push(chalk.red(`${summary.by_severity['error']} errors`));
  if (summary.by_severity['warning']) parts.push(chalk.yellow(`${summary.by_severity['warning']} warnings`));
  if (summary.by_severity['info']) parts.push(chalk.blue(`${summary.by_severity['info']} info`));

  lines.push(`  ${chalk.bold('Total:')} ${summary.total_findings} findings (${parts.join(', ')})`);
  lines.push('');

  return lines.join('\n');
}

const CATEGORY_ICONS: Record<string, string> = {
  state: '⚡',
  perf: '🏎',
  scss: '🎨',
  arch: '🏛',
  a11y: '♿',
  component: '🧩',
  ionic: '📱',
  ux: '👤',
  domain: '🔷',
};

function formatSummaryTable(report: Report): string[] {
  const lines: string[] = [];
  const { by_category } = report.summary;
  const categories = Object.entries(by_category).sort((a, b) => b[1] - a[1]);

  if (categories.length === 0) return lines;

  lines.push(chalk.bold.underline('  By Category'));
  for (const [cat, count] of categories) {
    const icon = CATEGORY_ICONS[cat] ?? '•';
    const bar = '█'.repeat(Math.min(Math.ceil(count / 10), 40));
    lines.push(`  ${icon} ${cat.padEnd(12)} ${String(count).padStart(5)}  ${chalk.dim(bar)}`);
  }
  lines.push('');

  return lines;
}

function formatTopOffenders(findings: Finding[]): string[] {
  const byFile = groupBy(findings, (f) => f.file);
  const scored = Object.entries(byFile).map(([file, fileFnds]) => {
    const errors = fileFnds.filter((f) => f.severity === 'error').length;
    const warnings = fileFnds.filter((f) => f.severity === 'warning').length;
    const score = errors * 10 + warnings;
    return { file, total: fileFnds.length, errors, warnings, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 10);

  if (top.length === 0) return [];

  const lines: string[] = [];
  lines.push(chalk.bold.underline('  Top Offenders'));
  for (let i = 0; i < top.length; i++) {
    const { file, total, errors, warnings, score } = top[i]!;
    const parts: string[] = [];
    if (errors) parts.push(chalk.red(`${errors} errors`));
    if (warnings) parts.push(chalk.yellow(`${warnings} warnings`));
    lines.push(`  ${chalk.dim(`${i + 1}.`)} ${file} — ${total} findings (${parts.join(', ')}) ${chalk.dim(`[score: ${score}]`)}`);
  }
  lines.push('');

  return lines;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}
