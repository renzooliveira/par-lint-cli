import { Command } from 'commander';
import path from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import { loadConfig } from '../../config/loader.js';
import { scanFiles, getChangedFiles } from '../../discovery/scanner.js';
import { categorizeFiles } from '../../discovery/categorizer.js';
import { RuleRunner } from '../../engine/runner.js';
import { loadState, saveState, reconcileFindings } from '../../engine/state.js';
import { applySuppressions } from '../../engine/suppression.js';
import { loadBaseline, filterByBaseline } from '../../engine/baseline.js';
import { formatSarif } from '../formatters/sarif.js';
import { formatJson } from '../formatters/json.js';
import { ALL_RULES } from '../../rules/registry.js';
import { loadCustomRules } from '../../engine/plugin-loader.js';
import { loadBuiltinYamlRules } from '../../engine/yaml-loader.js';

export interface CiStats {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
  baselineFiltered: number;
}

export function buildCiSummary(stats: CiStats): string {
  const status = stats.errors > 0 ? chalk.red.bold('FAIL') : chalk.green.bold('PASS');
  const lines: string[] = [];

  lines.push('');
  lines.push(`  par-lint CI: ${status}`);
  lines.push(`  ${stats.total} findings (${stats.errors} errors, ${stats.warnings} warnings, ${stats.infos} info)`);
  if (stats.baselineFiltered > 0) {
    lines.push(chalk.dim(`  ${stats.baselineFiltered} findings filtered by baseline`));
  }
  lines.push('');

  return lines.join('\n');
}

export const ciCommand = new Command('ci')
  .description('Run analysis for CI: review + baseline + SARIF output')
  .option('--target <path>', 'Target project directory')
  .option('--incremental [base]', 'Only analyze changed files')
  .option('--baseline', 'Filter by baseline')
  .option('--save-baseline', 'Save current findings as baseline')
  .action(async (options: {
    target?: string;
    incremental?: string | true;
    baseline?: boolean;
    saveBaseline?: boolean;
  }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();
    const spinner = ora('par-lint CI running...').start();

    try {
      const { config } = await loadConfig(cwd);

      let files: string[];
      if (options.incremental !== undefined) {
        const baseRef = typeof options.incremental === 'string' ? options.incremental : 'HEAD~1';
        files = getChangedFiles(cwd, baseRef);
        spinner.text = `Incremental: ${files.length} changed files`;
      } else {
        files = await scanFiles({ cwd });
      }

      const categorized = categorizeFiles(files);
      const runner = new RuleRunner();
      runner.registerMany(ALL_RULES);

      const builtinYaml = await loadBuiltinYamlRules();
      runner.registerMany(builtinYaml);

      if (config.custom_rules.length > 0) {
        const customRules = await loadCustomRules(config.custom_rules, cwd);
        runner.registerMany(customRules);
      }

      const report = await runner.runAll(categorized, config, cwd);

      const statePath = path.resolve(cwd, config.output.state_path);
      const previousState = await loadState(statePath);
      const { findings: reconciled, resolved } = reconcileFindings(report.findings, previousState);

      let findings = await applySuppressions(reconciled, config, cwd);

      let baselineFiltered = 0;
      const baselinePath = path.resolve(cwd, '.par-lint/baseline.json');
      if (options.baseline) {
        const baselineIds = await loadBaseline(baselinePath);
        const before = findings.length;
        findings = filterByBaseline(findings, baselineIds);
        baselineFiltered = before - findings.length;
      }

      report.findings = findings;
      report.summary.total_findings = findings.length;
      report.summary.by_severity = {};
      for (const f of findings) {
        report.summary.by_severity[f.severity] = (report.summary.by_severity[f.severity] ?? 0) + 1;
      }
      report.diff.new_findings = findings.filter((f) => f.status === 'new').map((f) => f.finding_id);
      report.diff.persistent_findings = findings.filter((f) => f.status === 'persistent').map((f) => f.finding_id);
      report.diff.resolved_findings = resolved.map((r) => r.finding_id);

      await saveState(statePath, findings);

      const sarifPath = path.resolve(cwd, config.output.sarif_path);
      await mkdir(path.dirname(sarifPath), { recursive: true });
      await writeFile(sarifPath, formatSarif(report), 'utf-8');

      const jsonPath = path.resolve(cwd, config.output.json_path);
      await mkdir(path.dirname(jsonPath), { recursive: true });
      await writeFile(jsonPath, formatJson(report), 'utf-8');

      if (options.saveBaseline) {
        const { saveBaseline } = await import('../../engine/baseline.js');
        await saveBaseline(baselinePath, findings);
      }

      spinner.stop();

      const stats: CiStats = {
        total: findings.length,
        errors: report.summary.by_severity['error'] ?? 0,
        warnings: report.summary.by_severity['warning'] ?? 0,
        infos: report.summary.by_severity['info'] ?? 0,
        baselineFiltered,
      };

      process.stdout.write(buildCiSummary(stats));
      console.log(chalk.dim(`  SARIF: ${path.relative(cwd, sarifPath)}`));
      console.log(chalk.dim(`  JSON:  ${path.relative(cwd, jsonPath)}`));
      console.log('');

      process.exitCode = stats.errors > 0 ? 1 : 0;
    } catch (error) {
      spinner.fail('CI analysis failed');
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 2;
    }
  });
