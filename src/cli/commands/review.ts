import { Command } from 'commander';
import path from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import ora from 'ora';
import { loadConfig } from '../../config/loader.js';
import { scanFiles } from '../../discovery/scanner.js';
import { categorizeFiles } from '../../discovery/categorizer.js';
import { RuleRunner } from '../../engine/runner.js';
import { loadState, saveState, reconcileFindings } from '../../engine/state.js';
import { applySuppressions } from '../../engine/suppression.js';
import { formatJson } from '../formatters/json.js';
import { formatConsole } from '../formatters/console.js';
import { formatSarif } from '../formatters/sarif.js';
import { formatMarkdown } from '../formatters/markdown.js';
import { ALL_RULES } from '../../rules/registry.js';

export const reviewCommand = new Command('review')
  .description('Analyze codebase for pattern violations')
  .option('--output <formats>', 'Output formats: json,sarif,markdown', 'console')
  .option('--file <path>', 'Analyze a single file')
  .option('--severity <level>', 'Minimum severity to report: info,warning,error', 'info')
  .option('--json', 'Output JSON to stdout')
  .option('--dry-run', 'Run analysis without writing state')
  .action(async (options: {
    output: string;
    file?: string;
    severity: string;
    json: boolean;
    dryRun: boolean;
  }) => {
    const cwd = process.cwd();
    const spinner = ora('Loading configuration...').start();

    try {
      const { config, filepath: configPath } = await loadConfig(cwd);
      spinner.text = configPath
        ? `Config loaded from ${path.relative(cwd, configPath)}`
        : 'Using default configuration';

      spinner.text = 'Scanning files...';
      const files = await scanFiles({ cwd });
      const categorized = categorizeFiles(files);
      spinner.text = `Found ${categorized.length} files`;

      spinner.text = 'Running rules...';
      const runner = new RuleRunner();
      runner.registerMany(ALL_RULES);

      const report = await runner.runAll(categorized, config, cwd);

      const statePath = path.resolve(cwd, config.output.state_path);
      const previousState = await loadState(statePath);
      const { findings: reconciledFindings, resolved } = reconcileFindings(report.findings, previousState);

      report.findings = await applySuppressions(reconciledFindings, config, cwd);

      report.summary.by_status = {};
      for (const f of report.findings) {
        report.summary.by_status[f.status] = (report.summary.by_status[f.status] ?? 0) + 1;
      }

      report.diff.new_findings = report.findings.filter((f) => f.status === 'new').map((f) => f.finding_id);
      report.diff.persistent_findings = report.findings.filter((f) => f.status === 'persistent').map((f) => f.finding_id);
      report.diff.resolved_findings = resolved.map((r) => r.finding_id);

      if (!options.dryRun) {
        await saveState(statePath, report.findings);
      }

      spinner.stop();

      if (options.json) {
        process.stdout.write(formatJson(report));
        return;
      }

      const formats = options.output.split(',');

      if (formats.includes('console') || formats.length === 0) {
        process.stdout.write(formatConsole(report));
      }

      if (formats.includes('json')) {
        const jsonPath = path.resolve(cwd, config.output.json_path);
        await mkdir(path.dirname(jsonPath), { recursive: true });
        await writeFile(jsonPath, formatJson(report), 'utf-8');
        console.log(`  JSON written to ${path.relative(cwd, jsonPath)}`);
      }

      if (formats.includes('sarif')) {
        const sarifPath = path.resolve(cwd, config.output.sarif_path);
        await mkdir(path.dirname(sarifPath), { recursive: true });
        await writeFile(sarifPath, formatSarif(report), 'utf-8');
        console.log(`  SARIF written to ${path.relative(cwd, sarifPath)}`);
      }

      if (formats.includes('markdown')) {
        const mdPath = path.resolve(cwd, config.output.markdown_path);
        await mkdir(path.dirname(mdPath), { recursive: true });
        await writeFile(mdPath, formatMarkdown(report), 'utf-8');
        console.log(`  Markdown written to ${path.relative(cwd, mdPath)}`);
      }

      const hasErrors = (report.summary.by_severity['error'] ?? 0) > 0;
      process.exitCode = hasErrors ? 1 : 0;

    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 2;
    }
  });
