import { Command } from 'commander';
import path from 'node:path';
import { watch } from 'node:fs';
import chalk from 'chalk';
import { loadConfig } from '../../config/loader.js';
import { categorizeFiles } from '../../discovery/categorizer.js';
import { RuleRunner } from '../../engine/runner.js';
import { formatConsole } from '../formatters/console.js';
import { ALL_RULES } from '../../rules/registry.js';
import { loadCustomRules } from '../../engine/plugin-loader.js';

const WATCH_EXTENSIONS = new Set(['.ts', '.html', '.scss', '.css']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.par-lint', 'coverage']);
const CONFIG_FILES = new Set([
  'par-lint.config.yaml', 'par-lint.config.yml', 'par-lint.config.json',
  '.par-lint.yaml', '.par-lint.yml',
]);

export function createDebouncer(
  fn: (files: Set<string>) => void,
  delayMs: number,
): (file: string) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const pending = new Set<string>();

  return (file: string) => {
    pending.add(file);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const batch = new Set(pending);
      pending.clear();
      timer = null;
      fn(batch);
    }, delayMs);
  };
}

export const watchCommand = new Command('watch')
  .description('Watch for file changes and re-analyze incrementally')
  .option('--target <path>', 'Target project directory')
  .option('--severity <level>', 'Minimum severity: info,warning,error', 'info')
  .option('--debounce <ms>', 'Debounce delay in ms', '300')
  .action(async (options: {
    target?: string;
    severity: string;
    debounce: string;
  }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();
    const debounceMs = parseInt(options.debounce, 10) || 300;

    let { config } = await loadConfig(cwd);

    const runner = new RuleRunner();
    runner.registerMany(ALL_RULES);

    if (config.custom_rules.length > 0) {
      const customRules = await loadCustomRules(config.custom_rules, cwd);
      runner.registerMany(customRules);
    }

    const SEVERITY_RANK: Record<string, number> = { info: 0, warning: 1, error: 2 };
    const minRank = SEVERITY_RANK[options.severity] ?? 0;

    console.log(chalk.bold(`\n  par-lint watch`));
    console.log(chalk.dim(`  Watching ${cwd}`));
    console.log(chalk.dim(`  Press Ctrl+C to stop\n`));

    const reloadConfig = async () => {
      try {
        const result = await loadConfig(cwd);
        config = result.config;
        console.log(chalk.cyan(`  [${new Date().toLocaleTimeString()}] Config reloaded`));
      } catch (err) {
        console.error(chalk.red(`  Config reload failed: ${err instanceof Error ? err.message : err}`));
      }
    };

    const analyze = async (files: Set<string>) => {
      const filePaths = [...files];
      const categorized = categorizeFiles(filePaths);
      if (categorized.length === 0) return;

      const start = Date.now();
      const report = await runner.runAll(categorized, config, cwd);

      report.findings = report.findings.filter(
        (f) => (SEVERITY_RANK[f.severity] ?? 0) >= minRank,
      );
      report.summary.total_findings = report.findings.length;
      report.summary.by_severity = {};
      for (const f of report.findings) {
        report.summary.by_severity[f.severity] = (report.summary.by_severity[f.severity] ?? 0) + 1;
      }

      const elapsed = Date.now() - start;
      console.log(chalk.dim(`\n  [${new Date().toLocaleTimeString()}] ${filePaths.length} file(s) analyzed in ${elapsed}ms`));

      if (report.findings.length > 0) {
        process.stdout.write(formatConsole(report));
      } else {
        console.log(chalk.green('  No issues found.\n'));
      }
    };

    const debounced = createDebouncer((files) => {
      analyze(files).catch((err) => {
        console.error(chalk.red(`  Error: ${err instanceof Error ? err.message : err}`));
      });
    }, debounceMs);

    watch(cwd, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      const normalized = filename.replace(/\\/g, '/');
      const basename = path.basename(normalized);

      if (CONFIG_FILES.has(basename)) {
        reloadConfig();
        return;
      }

      const parts = normalized.split('/');
      if (parts.some((p) => IGNORE_DIRS.has(p))) return;

      const ext = path.extname(normalized);
      if (!WATCH_EXTENSIONS.has(ext)) return;

      debounced(normalized);
    });
  });
