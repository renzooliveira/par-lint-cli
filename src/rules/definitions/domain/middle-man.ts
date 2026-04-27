import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const METHOD_RE = /^\s*(?:async\s+)?(?:public\s+|private\s+|protected\s+)?(\w+)\s*\([^)]*\)\s*[:{]/;
const DELEGATE_RE = /^\s*return\s+(?:await\s+)?this\.\w+\.\w+\s*\(/;

export const middleManRule: RuleDefinition = {
  id: 'domain/middle-man',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects classes where most methods just delegate to another object',
  principle: 'A class where >80% of methods only delegate adds no value — remove the middle man',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const opts = config.rules['domain/middle-man'] as { threshold?: number } | undefined;
    const threshold = opts?.threshold ?? 0.8;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    let className = '';
    let classLine = 0;
    let totalMethods = 0;
    let delegateMethods = 0;
    let inMethod = false;
    let methodBodyLines: string[] = [];
    let braceDepth = 0;
    const findings: ReturnType<typeof createFinding>[] = [];

    const flushClass = () => {
      if (className && totalMethods >= 3 && delegateMethods / totalMethods > threshold) {
        findings.push(createFinding({
          rule_id: 'domain/middle-man',
          file: file.path,
          line: classLine,
          severity: 'info',
          message: `Class '${className}' delegates ${delegateMethods}/${totalMethods} methods. Consider removing the middle man.`,
          source_principle: 'A class where most methods only delegate adds no value',
          category: 'domain',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.middleMan',
            query: { file: file.path },
            result: { className, total: totalMethods, delegating: delegateMethods },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
      className = '';
      totalMethods = 0;
      delegateMethods = 0;
    };

    const flushMethod = () => {
      if (!inMethod) return;
      totalMethods++;
      const nonEmpty = methodBodyLines.filter(l => l.trim().length > 0);
      if (nonEmpty.length === 1 && DELEGATE_RE.test(nonEmpty[0]!)) {
        delegateMethods++;
      }
      inMethod = false;
      methodBodyLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      const classMatch = line.match(/^\s*(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        flushMethod();
        flushClass();
        className = classMatch[1]!;
        classLine = i + 1;
        braceDepth = 0;
        continue;
      }

      if (!className) continue;

      const methodMatch = line.match(METHOD_RE);
      if (methodMatch && methodMatch[1] !== 'constructor') {
        flushMethod();
        inMethod = true;
        methodBodyLines = [];
        continue;
      }

      if (inMethod) {
        const trimmed = line.trim();
        if (trimmed !== '{' && trimmed !== '}') {
          methodBodyLines.push(line);
        }
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
      }
    }

    flushMethod();
    flushClass();

    return findings;
  },
};
