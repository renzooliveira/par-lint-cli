import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface HtmlA11yIssue {
  line: number;
  column: number;
  element: string;
  issue: string;
}

export async function readHtmlSource(filePath: string, cwd: string): Promise<string> {
  return readFile(path.resolve(cwd, filePath), 'utf-8');
}

const IMG_TAG_RE = /<img\b([^>]*)>/gi;
const ALT_ATTR_RE = /\balt\s*=/i;
const BOUND_ALT_RE = /\[alt\]\s*=/i;

export function findMissingAlt(source: string): HtmlA11yIssue[] {
  const lines = source.split('\n');
  const results: HtmlA11yIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    IMG_TAG_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = IMG_TAG_RE.exec(line)) !== null) {
      const attrs = match[1]!;
      if (!ALT_ATTR_RE.test(attrs) && !BOUND_ALT_RE.test(attrs)) {
        results.push({
          line: i + 1,
          column: match.index + 1,
          element: match[0],
          issue: 'img missing alt attribute',
        });
      }
    }
  }

  return results;
}

const INPUT_TAG_RE = /<(?:input|select|textarea)\b([^>]*)>/gi;
const LABEL_ATTR_RE = /\b(?:aria-label|aria-labelledby|id)\s*=/i;
const BOUND_LABEL_RE = /\[(?:aria-label|aria-labelledby)\]\s*=/i;
export function findMissingLabel(source: string): HtmlA11yIssue[] {
  const lines = source.split('\n');
  const results: HtmlA11yIssue[] = [];

  const labelForIds = new Set<string>();
  const LABEL_FOR_RE = /<label\b[^>]*\bfor\s*=\s*["']([^"']+)["']/gi;
  for (const line of lines) {
    LABEL_FOR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LABEL_FOR_RE.exec(line)) !== null) {
      labelForIds.add(m[1]!);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    INPUT_TAG_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = INPUT_TAG_RE.exec(line)) !== null) {
      const attrs = match[1]!;
      if (LABEL_ATTR_RE.test(attrs) || BOUND_LABEL_RE.test(attrs)) continue;

      const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/);
      if (idMatch && labelForIds.has(idMatch[1]!)) continue;

      results.push({
        line: i + 1,
        column: match.index + 1,
        element: match[0],
        issue: 'form control missing accessible label',
      });
    }
  }

  return results;
}

const CLICKABLE_NON_BUTTON_RE = /<(div|span|a(?!\s+href)|li|td|p|section|article|label)\b([^>]*)\(click\)\s*=/gi;

export function findNonButtonAsButton(source: string): HtmlA11yIssue[] {
  const lines = source.split('\n');
  const results: HtmlA11yIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    CLICKABLE_NON_BUTTON_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = CLICKABLE_NON_BUTTON_RE.exec(line)) !== null) {
      const attrs = match[2]! + line.slice(match.index + match[0].length);
      if (/\brole\s*=\s*["']button["']/i.test(attrs)) continue;
      if (/\[role\]\s*=\s*["'].*button/i.test(attrs)) continue;

      results.push({
        line: i + 1,
        column: match.index + 1,
        element: `<${match[1]}>`,
        issue: `non-interactive element <${match[1]}> used as button with (click) handler`,
      });
    }
  }

  return results;
}
