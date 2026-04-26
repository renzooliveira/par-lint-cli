import { Command } from 'commander';
import path from 'node:path';
import chalk from 'chalk';
import { loadConfig } from '../../config/loader.js';
import { loadState } from '../../engine/state.js';
import type { Finding } from '../../types/finding.js';

function countBy(items: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return counts;
}

export function buildSummaryOutput(findings: Finding[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold(`  par-lint summary: ${findings.length} findings`));
  lines.push('');

  if (findings.length === 0) {
    lines.push(chalk.green('  No findings. Clean codebase!'));
    lines.push('');
    return lines.join('\n');
  }

  const bySeverity = countBy(findings.map((f) => f.severity));
  lines.push(chalk.bold('  By severity:'));
  for (const [sev, count] of Object.entries(bySeverity).sort((a, b) => b[1] - a[1])) {
    const color = sev === 'error' ? chalk.red : sev === 'warning' ? chalk.yellow : chalk.blue;
    lines.push(`    ${color(sev.padEnd(10))} ${count}`);
  }
  lines.push('');

  const byCategory = countBy(findings.map((f) => f.category));
  lines.push(chalk.bold('  By category:'));
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.min(count, 40));
    lines.push(`    ${cat.padEnd(12)} ${String(count).padStart(4)} ${chalk.cyan(bar)}`);
  }
  lines.push('');

  const byFile = countBy(findings.map((f) => f.file));
  const topFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 10);
  lines.push(chalk.bold('  Top files:'));
  for (const [file, count] of topFiles) {
    lines.push(`    ${String(count).padStart(4)}  ${file}`);
  }
  lines.push('');

  const byStatus = countBy(findings.map((f) => f.status));
  if (Object.keys(byStatus).length > 0) {
    lines.push(chalk.bold('  By status:'));
    for (const [status, count] of Object.entries(byStatus).sort()) {
      lines.push(`    ${status.padEnd(12)} ${count}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export const summaryCommand = new Command('summary')
  .description('Show summary dashboard from last analysis state')
  .option('--target <path>', 'Target project directory')
  .option('--json', 'Output as JSON')
  .action(async (options: { target?: string; json?: boolean }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();

    const { config } = await loadConfig(cwd);
    const statePath = path.resolve(cwd, config.output.state_path);
    const state = await loadState(statePath);

    if (!state) {
      console.log(chalk.yellow('\n  No analysis state found. Run `par-lint review` first.\n'));
      return;
    }

    const findings: Finding[] = Object.values(state.active_findings) as unknown as Finding[];

    if (options.json) {
      const bySeverity = countBy(findings.map((f) => f.severity));
      const byCategory = countBy(findings.map((f) => f.category));
      process.stdout.write(JSON.stringify({
        total: findings.length,
        by_severity: bySeverity,
        by_category: byCategory,
      }, null, 2));
      return;
    }

    process.stdout.write(buildSummaryOutput(findings));
  });
