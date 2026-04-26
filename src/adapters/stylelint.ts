import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface ScssNestingInfo {
  line: number;
  depth: number;
  selector: string;
}

export interface ScssValueMatch {
  line: number;
  column: number;
  value: string;
  property: string;
}

export async function readScssSource(filePath: string, cwd: string): Promise<string> {
  return readFile(path.resolve(cwd, filePath), 'utf-8');
}

export function findDeepNesting(source: string, maxDepth: number = 3): ScssNestingInfo[] {
  const lines = source.split('\n');
  const results: ScssNestingInfo[] = [];
  let depth = 0;
  const selectorStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    const opens = (trimmed.match(/{/g) ?? []).length;
    const closes = (trimmed.match(/}/g) ?? []).length;

    if (opens > 0) {
      const selector = trimmed.replace(/\s*\{.*/, '').trim();
      if (selector && !selector.startsWith('@') || selector.startsWith('@media') || selector.startsWith('@supports')) {
        selectorStack.push(selector);
      }
      depth += opens;

      if (depth > maxDepth && selector && !selector.startsWith('@include') && !selector.startsWith('@mixin')) {
        results.push({
          line: i + 1,
          depth,
          selector: selectorStack.join(' > '),
        });
      }
    }

    if (closes > 0) {
      depth -= closes;
      for (let c = 0; c < closes; c++) {
        selectorStack.pop();
      }
    }

    if (depth < 0) depth = 0;
  }

  return results;
}

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3,8})\b/g;
const RGB_COLOR_RE = /\brgba?\s*\([^)]+\)/g;
const HSL_COLOR_RE = /\bhsla?\s*\([^)]+\)/g;

const IGNORE_LINES_RE = /^\s*\/\/|^\s*\*|^\s*\/\*/;
const VARIABLE_RE = /\$[\w-]+\s*:/;

export function findHardcodedColors(source: string): ScssValueMatch[] {
  const lines = source.split('\n');
  const results: ScssValueMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (IGNORE_LINES_RE.test(line)) continue;
    if (VARIABLE_RE.test(line)) continue;

    const propertyMatch = line.match(/^\s*([\w-]+)\s*:/);
    const property = propertyMatch?.[1] ?? '';

    for (const re of [HEX_COLOR_RE, RGB_COLOR_RE, HSL_COLOR_RE]) {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(line)) !== null) {
        results.push({
          line: i + 1,
          column: match.index + 1,
          value: match[0],
          property,
        });
      }
    }
  }

  return results;
}

const SPACING_PROPS = new Set([
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap',
  'top', 'right', 'bottom', 'left',
]);

const HARDCODED_PX_RE = /:\s*([^;$]*\b\d+px\b[^;]*)/;

export function findHardcodedSpacing(source: string): ScssValueMatch[] {
  const lines = source.split('\n');
  const results: ScssValueMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (IGNORE_LINES_RE.test(line)) continue;
    if (VARIABLE_RE.test(line)) continue;

    const propertyMatch = line.match(/^\s*([\w-]+)\s*:/);
    if (!propertyMatch) continue;

    const property = propertyMatch[1]!;
    if (!SPACING_PROPS.has(property)) continue;

    const valueMatch = HARDCODED_PX_RE.exec(line);
    if (valueMatch) {
      if (line.includes('var(') || line.includes('$')) continue;
      const rawValue = valueMatch[1]!.trim();
      if (/^0px$/.test(rawValue)) continue;

      results.push({
        line: i + 1,
        column: (line.indexOf(valueMatch[1]!) + 1),
        value: valueMatch[1]!.trim(),
        property,
      });
    }
  }

  return results;
}
