import { Command } from 'commander';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import type { Finding } from '../../types/finding.js';

export interface DiffResult {
  added: Finding[];
  removed: Finding[];
  unchanged: number;
  delta: number;
}

export function computeDiff(before: Finding[], after: Finding[]): DiffResult {
  const beforeIds = new Set(before.map((f) => f.finding_id));
  const afterIds = new Set(after.map((f) => f.finding_id));

  const added = after.filter((f) => !beforeIds.has(f.finding_id));
  const removed = before.filter((f) => !afterIds.has(f.finding_id));
  const unchanged = after.length - added.length;

  return {
    added,
    removed,
    unchanged,
    delta: after.length - before.length,
  };
}

function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('  par-lint diff'));
  lines.push('');

  const deltaStr = diff.delta > 0 ? chalk.red(`+${diff.delta}`) : diff.delta < 0 ? chalk.green(`${diff.delta}`) : chalk.dim('±0');
  lines.push(`  Delta: ${deltaStr} | Added: ${diff.added.length} | Removed: ${diff.removed.length} | Unchanged: ${diff.unchanged}`);
  lines.push('');

  if (diff.added.length > 0) {
    lines.push(chalk.red.bold('  New findings:'));
    for (const f of diff.added) {
      lines.push(chalk.red(`    + [${f.severity}] ${f.rule_id} at ${f.file}:${f.line}`));
    }
    lines.push('');
  }

  if (diff.removed.length > 0) {
    lines.push(chalk.green.bold('  Resolved findings:'));
    for (const f of diff.removed) {
      lines.push(chalk.green(`    - [${f.severity}] ${f.rule_id} at ${f.file}:${f.line}`));
    }
    lines.push('');
  }

  if (diff.added.length === 0 && diff.removed.length === 0) {
    lines.push(chalk.dim('  No changes between reports.'));
    lines.push('');
  }

  return lines.join('\n');
}

async function loadFindings(filePath: string): Promise<Finding[]> {
  const content = await readFile(filePath, 'utf-8');
  const data = JSON.parse(content);

  if (data.findings) return data.findings;
  if (data.active_findings) return Object.values(data.active_findings) as Finding[];

  return [];
}

export const diffCommand = new Command('diff')
  .description('Compare two analysis reports or states')
  .argument('<before>', 'Path to before report/state JSON')
  .argument('<after>', 'Path to after report/state JSON')
  .option('--json', 'Output as JSON')
  .action(async (beforePath: string, afterPath: string, options: { json?: boolean }) => {
    try {
      const before = await loadFindings(path.resolve(beforePath));
      const after = await loadFindings(path.resolve(afterPath));

      const diff = computeDiff(before, after);

      if (options.json) {
        process.stdout.write(JSON.stringify({
          added: diff.added.length,
          removed: diff.removed.length,
          unchanged: diff.unchanged,
          delta: diff.delta,
          new_findings: diff.added.map((f) => ({ id: f.finding_id, rule: f.rule_id, file: f.file, line: f.line })),
          resolved_findings: diff.removed.map((f) => ({ id: f.finding_id, rule: f.rule_id, file: f.file, line: f.line })),
        }, null, 2));
        return;
      }

      process.stdout.write(formatDiff(diff));

      if (diff.delta > 0) process.exitCode = 1;
    } catch (err) {
      console.error(chalk.red(`  Error: ${err instanceof Error ? err.message : err}`));
      process.exitCode = 2;
    }
  });
