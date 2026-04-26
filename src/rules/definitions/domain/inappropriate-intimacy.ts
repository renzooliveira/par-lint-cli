import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TYPE_REF_RE = /:\s*([A-Z]\w+)/g;
const IMPORT_RE = /import\s+.*\{([^}]+)\}/g;

export const inappropriateIntimacyRule: RuleDefinition = {
  id: 'domain/inappropriate-intimacy',
  version: '1.0.0',
  category: 'domain',
  severity: 'warning',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['domain/inappropriate-intimacy'] as { threshold?: number } | undefined;
    const threshold = opts?.threshold ?? 5;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const importedTypes = new Set<string>();
    for (const line of lines) {
      IMPORT_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = IMPORT_RE.exec(line)) !== null) {
        for (const name of m[1]!.split(',')) {
          const trimmed = name.trim().replace(/\s+as\s+\w+/, '');
          if (trimmed && /^[A-Z]/.test(trimmed)) {
            importedTypes.add(trimmed);
          }
        }
      }
    }

    if (importedTypes.size === 0) return [];

    const refCounts = new Map<string, { count: number; members: Set<string>; firstLine: number }>();
    const MEMBER_RE = /(\w+)\.(\w+)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('import ')) continue;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      TYPE_REF_RE.lastIndex = 0;
      let tm: RegExpExecArray | null;
      while ((tm = TYPE_REF_RE.exec(line)) !== null) {
        const typeName = tm[1]!;
        if (importedTypes.has(typeName)) {
          const entry = refCounts.get(typeName) ?? { count: 0, members: new Set<string>(), firstLine: i + 1 };
          entry.count++;
          refCounts.set(typeName, entry);
        }
      }

      MEMBER_RE.lastIndex = 0;
      let mm: RegExpExecArray | null;
      while ((mm = MEMBER_RE.exec(line)) !== null) {
        const varName = mm[1]!;
        const member = mm[2]!;
        if (varName === 'this' || varName === 'self') continue;

        for (const typeName of importedTypes) {
          const typeLC = typeName.toLowerCase();
          if (varName.toLowerCase().includes(typeLC) || varName.endsWith(typeName[0]!.toLowerCase())) {
            const entry = refCounts.get(typeName) ?? { count: 0, members: new Set<string>(), firstLine: i + 1 };
            entry.members.add(member);
            refCounts.set(typeName, entry);
          }
        }
      }
    }

    const findings = [];
    for (const [typeName, data] of refCounts) {
      const totalRefs = data.count + data.members.size;
      if (totalRefs > threshold) {
        findings.push(createFinding({
          rule_id: 'domain/inappropriate-intimacy',
          file: file.path,
          line: data.firstLine,
          severity: 'warning',
          message: `Inappropriate intimacy with '${typeName}': ${totalRefs} cross-references (threshold: ${threshold}). Consider extracting shared logic.`,
          source_principle: 'Classes should not know each other in excessive depth',
          category: 'domain',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { type: typeName, totalRefs, threshold },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
