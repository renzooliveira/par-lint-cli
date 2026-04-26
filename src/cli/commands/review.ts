import { Command } from 'commander';
import path from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import ora from 'ora';
import { loadConfig } from '../../config/loader.js';
import { scanFiles, getChangedFiles } from '../../discovery/scanner.js';
import { categorizeFiles } from '../../discovery/categorizer.js';
import { RuleRunner } from '../../engine/runner.js';
import { loadState, saveState, reconcileFindings } from '../../engine/state.js';
import { applySuppressions } from '../../engine/suppression.js';
import { FileCache, hashFile } from '../../engine/cache.js';
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
  .option('--target <path>', 'Target project directory to analyze')
  .option('--category <cats>', 'Filter by category (comma-separated): state,perf,scss,arch,a11y,component,ionic,ux,domain')
  .option('--rule <ids>', 'Filter by rule ID (comma-separated)')
  .option('--incremental [base]', 'Only analyze files changed since base ref (default: HEAD~1)')
  .option('--no-cache', 'Disable file hash caching')
  .action(async (options: {
    output: string;
    file?: string;
    severity: string;
    json: boolean;
    dryRun: boolean;
    target?: string;
    category?: string;
    rule?: string;
    incremental?: string | true;
    cache: boolean;
  }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();
    const spinner = ora('Loading configuration...').start();

    try {
      const { config, filepath: configPath } = await loadConfig(cwd);
      spinner.text = configPath
        ? `Config loaded from ${path.relative(cwd, configPath)}`
        : 'Using default configuration';

      spinner.text = 'Scanning files...';
      let files: string[];
      if (options.file) {
        files = [options.file];
      } else if (options.incremental !== undefined) {
        const baseRef = typeof options.incremental === 'string' ? options.incremental : 'HEAD~1';
        files = getChangedFiles(cwd, baseRef);
        spinner.text = `Incremental: ${files.length} changed files (base: ${baseRef})`;
      } else {
        files = await scanFiles({ cwd });
      }
      const categorized = categorizeFiles(files);
      spinner.text = `Found ${categorized.length} files`;

      spinner.text = 'Running rules...';
      const runner = new RuleRunner();
      runner.registerMany(ALL_RULES);

      let cache: FileCache | undefined;
      if (options.cache && config.performance.cache_enabled) {
        const cachePath = path.resolve(cwd, '.par-lint/cache.json');
        cache = new FileCache(cachePath);
        await cache.load();
      }

      const report = await runner.runAll(categorized, config, cwd, cache ? {
        cache,
        hashFn: (filePath) => hashFile(path.resolve(cwd, filePath)),
      } : undefined);

      const statePath = path.resolve(cwd, config.output.state_path);
      const previousState = await loadState(statePath);
      const { findings: reconciledFindings, resolved } = reconcileFindings(report.findings, previousState);

      const SEVERITY_RANK: Record<string, number> = { info: 0, warning: 1, error: 2 };
      const minRank = SEVERITY_RANK[options.severity] ?? 0;

      const suppressed = await applySuppressions(reconciledFindings, config, cwd);
      const categoryFilter = options.category ? new Set(options.category.split(',').map((c) => c.trim())) : null;
      const ruleFilter = options.rule ? new Set(options.rule.split(',').map((r) => r.trim())) : null;
      report.findings = suppressed
        .filter((f) => (SEVERITY_RANK[f.severity] ?? 0) >= minRank)
        .filter((f) => !categoryFilter || categoryFilter.has(f.category))
        .filter((f) => !ruleFilter || ruleFilter.has(f.rule_id));

      report.summary.total_findings = report.findings.length;
      report.summary.by_severity = {};
      report.summary.by_category = {};
      report.summary.by_status = {};
      for (const f of report.findings) {
        report.summary.by_severity[f.severity] = (report.summary.by_severity[f.severity] ?? 0) + 1;
        report.summary.by_category[f.category] = (report.summary.by_category[f.category] ?? 0) + 1;
        report.summary.by_status[f.status] = (report.summary.by_status[f.status] ?? 0) + 1;
      }

      report.diff.new_findings = report.findings.filter((f) => f.status === 'new').map((f) => f.finding_id);
      report.diff.persistent_findings = report.findings.filter((f) => f.status === 'persistent').map((f) => f.finding_id);
      report.diff.resolved_findings = resolved.map((r) => r.finding_id);

      if (!options.dryRun) {
        await saveState(statePath, report.findings);
        if (cache) await cache.save();
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
