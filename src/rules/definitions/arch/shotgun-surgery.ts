import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { execSync } from 'node:child_process';

export const shotgunSurgeryRule: RuleDefinition = {
  id: 'arch/shotgun-surgery-candidate',
  version: '1.0.0',
  category: 'arch',
  severity: 'info',
  description: 'File co-changes frequently with many others in git history',
  principle: 'Frequent cascading changes indicate wrong cohesion boundaries',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['arch/shotgun-surgery-candidate'] as {
      threshold?: number;
      since?: string;
    } | undefined;
    const threshold = opts?.threshold ?? 3;
    const since = opts?.since ?? '6 months ago';

    try {
      const raw = execSync(
        `git log --name-only --format=%H --since="${since}" -- "${file.path}"`,
        { cwd },
      );
      const output = typeof raw === 'string' ? raw : raw.toString('utf-8');

      const coChanges = new Map<string, number>();
      let inCommit = false;

      for (const line of output.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
          inCommit = false;
          continue;
        }
        if (/^[a-f0-9]{7,40}$/.test(trimmed)) {
          inCommit = true;
          continue;
        }
        if (inCommit && trimmed !== file.path) {
          coChanges.set(trimmed, (coChanges.get(trimmed) ?? 0) + 1);
        }
      }

      const frequentCoChanges = [...coChanges.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1]);

      if (frequentCoChanges.length >= threshold) {
        const topFiles = frequentCoChanges.slice(0, 5).map(([f, c]) => `${f} (${c}x)`).join(', ');
        return [createFinding({
          rule_id: 'arch/shotgun-surgery-candidate',
          file: file.path,
          line: 1,
          severity: 'info',
          message: `Shotgun surgery candidate: co-changes frequently with ${frequentCoChanges.length} files. Top: ${topFiles}. Consider consolidating related logic.`,
          source_principle: 'Frequent cascading changes indicate wrong cohesion boundaries',
          category: 'arch',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'git-log',
            query: { file: file.path, since },
            result: { coChangeCount: frequentCoChanges.length, threshold, top: frequentCoChanges.slice(0, 5) },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        })];
      }

      return [];
    } catch {
      return [];
    }
  },
};
