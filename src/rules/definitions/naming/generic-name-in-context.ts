import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const GENERIC_CLASS_NAMES = new Set([
  'Item', 'Data', 'Info', 'Manager', 'Handler', 'Processor', 'Helper',
  'Attachment', 'Detail', 'Details', 'List', 'Form', 'Model', 'Entity',
  'Record', 'Entry', 'Result', 'Response', 'Request', 'Payload',
  'Config', 'Options', 'Settings', 'State', 'Store', 'Base',
  'Common', 'Generic', 'Default', 'Main', 'Core', 'Util',
  'Service', 'Component', 'Page', 'Modal', 'Dialog',
]);

const FEATURE_PATH_RE = /\/(?:features|pages|modules|views|screens|domains)\/([a-z][a-z0-9-]+)\//;

const EXEMPT_DIRS = /\/(?:shared|common|core|lib|utils|helpers)\//;

const CLASS_RE = /(?:export\s+)?(?:abstract\s+)?(?:class|interface)\s+([A-Z]\w*)/g;

const TYPE_SUFFIXES = /(?:Service|Component|Page|Module|Guard|Interceptor|Pipe|Directive|Modal|Store|Entity|Model|Dto|Factory|Adapter|Port)$/;

function kebabToPascal(kebab: string): string {
  return kebab
    .split('-')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
}

function stripTypeSuffix(name: string): string {
  return name.replace(TYPE_SUFFIXES, '');
}

export const genericNameInContextRule: RuleDefinition = {
  id: 'naming/generic-name-in-context',
  version: '1.0.0',
  category: 'naming',
  severity: 'info',
  description: 'Detects generic class names inside feature directories that should include feature context',
  principle: 'Class names in feature modules should reflect their domain context, not generic concepts',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    if (EXEMPT_DIRS.test(file.path)) return [];

    const featureMatch = file.path.match(FEATURE_PATH_RE);
    if (!featureMatch) return [];

    const featureName = featureMatch[1]!;
    const featurePascal = kebabToPascal(featureName);

    let source: string;
    try {
      source = await readSource(file.path, cwd);
    } catch {
      return [];
    }

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      CLASS_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = CLASS_RE.exec(lines[i]!)) !== null) {
        const className = match[1]!;
        const coreName = stripTypeSuffix(className);

        if (!GENERIC_CLASS_NAMES.has(coreName)) continue;
        if (className.startsWith(featurePascal)) continue;

        findings.push(createFinding({
          rule_id: 'naming/generic-name-in-context',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `"${className}" is generic inside feature "${featureName}". Consider "${featurePascal}${coreName}" or a more specific name.`,
          source_principle: 'Feature-scoped classes should include domain context in their name',
          category: 'naming',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.genericName',
            query: { file: file.path },
            result: { className, feature: featureName, suggested: `${featurePascal}${coreName}` },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
