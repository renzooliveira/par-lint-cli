export type FileTag =
  | 'is_component'
  | 'is_service'
  | 'is_directive'
  | 'is_pipe'
  | 'is_guard'
  | 'is_interceptor'
  | 'is_module'
  | 'is_entity'
  | 'is_model'
  | 'is_page'
  | 'is_page_template'
  | 'is_template'
  | 'is_style'
  | 'is_typescript'
  | 'is_html'
  | 'is_scss';

interface TagRule {
  tag: FileTag;
  test: (filePath: string) => boolean;
}

const TAG_RULES: TagRule[] = [
  { tag: 'is_component', test: (f) => f.endsWith('.component.ts') },
  { tag: 'is_service', test: (f) => f.endsWith('.service.ts') },
  { tag: 'is_directive', test: (f) => f.endsWith('.directive.ts') },
  { tag: 'is_pipe', test: (f) => f.endsWith('.pipe.ts') },
  { tag: 'is_guard', test: (f) => f.endsWith('.guard.ts') },
  { tag: 'is_interceptor', test: (f) => f.endsWith('.interceptor.ts') },
  { tag: 'is_module', test: (f) => f.endsWith('.module.ts') },
  { tag: 'is_entity', test: (f) => /\.(entity|model|domain)\.ts$/.test(f) },
  { tag: 'is_model', test: (f) => f.endsWith('.model.ts') },
  { tag: 'is_page', test: (f) => f.endsWith('.page.ts') || /\/pages\//.test(f) },
  { tag: 'is_page_template', test: (f) => f.endsWith('.page.html') },
  { tag: 'is_template', test: (f) => f.endsWith('.component.html') || f.endsWith('.page.html') },
  { tag: 'is_style', test: (f) => /\.(scss|css)$/.test(f) },
  { tag: 'is_typescript', test: (f) => f.endsWith('.ts') },
  { tag: 'is_html', test: (f) => f.endsWith('.html') },
  { tag: 'is_scss', test: (f) => f.endsWith('.scss') },
];

export interface CategorizedFile {
  path: string;
  tags: FileTag[];
}

export function categorizeFile(filePath: string): CategorizedFile {
  const tags = TAG_RULES
    .filter((rule) => rule.test(filePath))
    .map((rule) => rule.tag);

  return { path: filePath, tags };
}

export function categorizeFiles(filePaths: string[]): CategorizedFile[] {
  return filePaths.map(categorizeFile);
}
