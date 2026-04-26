import type { Finding } from '../types/finding.js';
import type { ParLintConfig } from '../types/config.js';
import type { CategorizedFile } from '../discovery/categorizer.js';
import type { Report, ReportDiff, ReportPerformance, ReportSummary } from '../types/report.js';
import type { FileCache } from './cache.js';
import { randomUUID } from 'node:crypto';

export interface RuleDefinition {
  id: string;
  version: string;
  category: string;
  severity: 'info' | 'warning' | 'error';
  applicable_to: string[];
  run(file: CategorizedFile, config: ParLintConfig, cwd: string): Promise<Finding[]>;
}

export class RuleRunner {
  private rules: RuleDefinition[] = [];

  register(rule: RuleDefinition): void {
    this.rules.push(rule);
  }

  registerMany(rules: RuleDefinition[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  getApplicableRules(file: CategorizedFile, config: ParLintConfig): RuleDefinition[] {
    return this.rules.filter((rule) => {
      const ruleConfig = config.rules[rule.id];
      if (ruleConfig && ruleConfig.enabled === false) return false;

      if (rule.applicable_to.length === 0) return true;
      return rule.applicable_to.some((tag) => file.tags.includes(tag as CategorizedFile['tags'][number]));
    });
  }

  async runFile(file: CategorizedFile, config: ParLintConfig, cwd: string): Promise<Finding[]> {
    const applicable = this.getApplicableRules(file, config);
    const findings: Finding[] = [];

    for (const rule of applicable) {
      const ruleConfig = config.rules[rule.id];

      if (ruleConfig?.exclude?.length) {
        if (matchesAnyGlob(file.path, ruleConfig.exclude)) continue;
      }

      const ruleFindings = await rule.run(file, config, cwd);

      for (const finding of ruleFindings) {
        if (ruleConfig?.severity) {
          finding.severity = ruleConfig.severity;
        }
        findings.push(finding);
      }
    }

    return findings;
  }

  async runAll(
    files: CategorizedFile[],
    config: ParLintConfig,
    cwd: string,
    options?: { cache?: FileCache; hashFn?: (path: string) => Promise<string> },
  ): Promise<Report> {
    const startTime = Date.now();
    const workers = Math.max(1, config.performance.parallel_workers);
    const allFindings: Finding[] = [];
    let cacheHits = 0;

    const processFile = async (file: CategorizedFile): Promise<Finding[]> => {
      if (options?.cache && options.hashFn) {
        try {
          const hash = await options.hashFn(file.path);
          const cached = options.cache.lookup(file.path, hash);
          if (cached) {
            cacheHits++;
            return cached;
          }
          const findings = await this.runFile(file, config, cwd);
          options.cache.store(file.path, hash, findings);
          return findings;
        } catch {
          return this.runFile(file, config, cwd);
        }
      }
      return this.runFile(file, config, cwd);
    };

    for (let i = 0; i < files.length; i += workers) {
      const chunk = files.slice(i, i + workers);
      const results = await Promise.all(chunk.map(processFile));
      for (const findings of results) {
        allFindings.push(...findings);
      }
    }

    const duration = Date.now() - startTime;
    const cacheRate = files.length > 0 ? cacheHits / files.length : 0;

    return buildReport(allFindings, config, cwd, duration, files.length, cacheRate);
  }

  get registeredRules(): RuleDefinition[] {
    return [...this.rules];
  }
}

function buildReport(
  findings: Finding[],
  config: ParLintConfig,
  cwd: string,
  durationMs: number,
  filesAnalyzed: number,
  cacheHitRate = 0,
): Report {
  const summary: ReportSummary = {
    total_findings: findings.length,
    by_severity: countBy(findings, (f) => f.severity),
    by_category: countBy(findings, (f) => f.category),
    by_confidence_band: countBy(findings, (f) => f.confidence_band),
    by_status: countBy(findings, (f) => f.status),
  };

  const diff: ReportDiff = {
    new_findings: findings.filter((f) => f.status === 'new').map((f) => f.finding_id),
    resolved_findings: [],
    persistent_findings: findings.filter((f) => f.status === 'persistent').map((f) => f.finding_id),
    stale_findings: [],
  };

  const performance: ReportPerformance = {
    total_duration_ms: durationMs,
    by_tool: {},
    cache_hit_rate: cacheHitRate,
    files_analyzed: filesAnalyzed,
  };

  return {
    report_id: randomUUID(),
    schema_version: '1.0',
    par_lint_version: '0.1.0',
    timestamp: new Date().toISOString(),
    project: {
      name: config.project.name,
      root: cwd,
      git_sha: '',
      git_branch: '',
    },
    summary,
    findings,
    diff,
    performance,
  };
}

function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§DOUBLESTAR§')
    .replace(/\*/g, '[^/]*')
    .replace(/§DOUBLESTAR§/g, '.*')
    .replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}

function matchesAnyGlob(filePath: string, globs: string[]): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return globs.some((glob) => globToRegex(glob).test(normalized));
}
