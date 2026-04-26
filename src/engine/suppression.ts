import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Finding, Suppression } from '../types/finding.js';
import type { ParLintConfig } from '../types/config.js';

const SUPPRESS_RE = /par-lint-disable(?:-next-line)?\s+([\w/,-]+)(?:\s+--\s+(.+))?/;
const SUPPRESS_FILE_RE = /par-lint-disable-file\s+([\w/,-]+)(?:\s+--\s+(.+))?/;

interface SuppressionDirective {
  ruleIds: string[];
  reason: string;
  scope: 'line' | 'file';
  line: number;
}

export function parseSuppressions(source: string): SuppressionDirective[] {
  const lines = source.split('\n');
  const directives: SuppressionDirective[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const fileMatch = SUPPRESS_FILE_RE.exec(line);
    if (fileMatch) {
      directives.push({
        ruleIds: fileMatch[1]!.split(',').map((r) => r.trim()),
        reason: fileMatch[2]?.trim() ?? '',
        scope: 'file',
        line: i + 1,
      });
      continue;
    }

    const lineMatch = SUPPRESS_RE.exec(line);
    if (lineMatch) {
      const isNextLine = line.includes('par-lint-disable-next-line');
      directives.push({
        ruleIds: lineMatch[1]!.split(',').map((r) => r.trim()),
        reason: lineMatch[2]?.trim() ?? '',
        scope: 'line',
        line: isNextLine ? i + 2 : i + 1,
      });
    }
  }

  return directives;
}

function matchesSuppression(finding: Finding, directive: SuppressionDirective): boolean {
  if (!directive.ruleIds.some((id) => id === finding.rule_id || id === '*')) return false;

  if (directive.scope === 'file') return true;
  return finding.line === directive.line;
}

export async function applySuppressions(
  findings: Finding[],
  config: ParLintConfig,
  cwd: string,
): Promise<Finding[]> {
  const fileCache = new Map<string, SuppressionDirective[]>();
  const suppressionPolicy = config.suppression;

  async function getDirectives(filePath: string): Promise<SuppressionDirective[]> {
    if (fileCache.has(filePath)) return fileCache.get(filePath)!;

    try {
      const source = await readFile(path.resolve(cwd, filePath), 'utf-8');
      const directives = parseSuppressions(source);
      fileCache.set(filePath, directives);
      return directives;
    } catch {
      fileCache.set(filePath, []);
      return [];
    }
  }

  const result: Finding[] = [];

  for (const finding of findings) {
    const directives = await getDirectives(finding.file);
    const suppression = directives.find((d) => matchesSuppression(finding, d));

    if (suppression) {
      if (suppressionPolicy.require_reason && suppression.reason.length < suppressionPolicy.min_reason_length) {
        result.push(finding);
        continue;
      }

      result.push({
        ...finding,
        suppression: {
          reason: suppression.reason,
          author: '',
          date: new Date().toISOString(),
          scope: suppression.scope === 'file' ? 'file' : 'line',
          source: 'inline_comment',
        } satisfies Suppression,
      });
    } else {
      result.push(finding);
    }
  }

  return result;
}
