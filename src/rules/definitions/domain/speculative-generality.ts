import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FUNC_WITH_OPTIONALS_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*\?[^)]*)\)/;
const OPTIONAL_PARAM_RE = /(\w+)\?\s*:/g;
const CLASS_GENERIC_RE = /(?:export\s+)?class\s+(\w+)\s*<\s*(\w+)\s*>/;
export const speculativeGeneralityRule: RuleDefinition = {
  id: 'domain/speculative-generality',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects unused optional parameters and generics always instantiated with the same type',
  principle: 'YAGNI — remove abstractions that are not validated by actual usage',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const funcMatch = line.match(FUNC_WITH_OPTIONALS_RE);
      if (!funcMatch) continue;

      const funcName = funcMatch[1]!;
      const params = funcMatch[2]!;
      const optionals: string[] = [];
      let m: RegExpExecArray | null;
      const optRe = new RegExp(OPTIONAL_PARAM_RE.source, 'g');
      while ((m = optRe.exec(params)) !== null) {
        optionals.push(m[1]!);
      }

      if (optionals.length === 0) continue;

      let depth = 0;
      let funcStarted = false;
      const bodyLines: string[] = [];
      for (let j = i; j < lines.length; j++) {
        const l = lines[j]!;
        for (const ch of l) {
          if (ch === '{') { depth++; funcStarted = true; }
          if (ch === '}') depth--;
        }
        if (funcStarted) bodyLines.push(l);
        if (funcStarted && depth <= 0) break;
      }

      const body = bodyLines.join('\n');
      const unusedOptionals = optionals.filter(p => {
        const usageRe = new RegExp(`\\b${p}\\b`);
        const bodyWithoutDecl = body.replace(line, '');
        return !usageRe.test(bodyWithoutDecl);
      });

      if (unusedOptionals.length > 0) {
        findings.push(createFinding({
          rule_id: 'domain/speculative-generality',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Function '${funcName}' has ${unusedOptionals.length} optional parameter(s) unused in body: ${unusedOptionals.join(', ')}.`,
          source_principle: 'YAGNI — remove abstractions not validated by usage',
          category: 'domain',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.speculativeGenerality',
            query: { file: file.path },
            result: { function: funcName, unusedOptionals },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    const classGenerics = new Map<string, { line: number; typeParam: string }>();
    for (let i = 0; i < lines.length; i++) {
      const gMatch = lines[i]!.match(CLASS_GENERIC_RE);
      if (gMatch) {
        classGenerics.set(gMatch[1]!, { line: i + 1, typeParam: gMatch[2]! });
      }
    }

    for (const [className, info] of classGenerics) {
      const usages: string[] = [];
      const usageRe = new RegExp(`new\\s+${className}\\s*<\\s*(\\w+)\\s*>`, 'g');
      let um: RegExpExecArray | null;
      while ((um = usageRe.exec(source)) !== null) {
        usages.push(um[1]!);
      }

      if (usages.length >= 2) {
        const unique = new Set(usages);
        if (unique.size === 1) {
          const concreteType = usages[0]!;
          findings.push(createFinding({
            rule_id: 'domain/speculative-generality',
            file: file.path,
            line: info.line,
            severity: 'info',
            message: `Generic class '${className}<${info.typeParam}>' is always instantiated with '${concreteType}'. Consider removing the generic.`,
            source_principle: 'YAGNI — remove abstractions not validated by usage',
            category: 'domain',
            fix_complexity: 'S',
            evidence_trail: [{
              tool: 'regex.speculativeGenerality',
              query: { file: file.path },
              result: { class: className, alwaysUsedAs: concreteType, usageCount: usages.length },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
