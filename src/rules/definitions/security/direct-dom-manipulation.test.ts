import { describe, it, expect, vi } from 'vitest';
import { directDomManipulationRule } from './direct-dom-manipulation.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/my.component.ts', tags: ['is_typescript'] };

describe('security/direct-dom-manipulation', () => {
  it('detects document.getElementById', async () => {
    mockedRead.mockResolvedValue(`
class MyComponent {
  ngAfterViewInit() {
    const el = document.getElementById('myDiv');
    el.innerHTML = '<b>test</b>';
  }
}
`);
    const findings = await directDomManipulationRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('detects document.createElement', async () => {
    mockedRead.mockResolvedValue(`
const div = document.createElement('div');
`);
    const findings = await directDomManipulationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('document.createElement');
  });

  it('detects nativeElement access', async () => {
    mockedRead.mockResolvedValue(`
class MyComponent {
  @ViewChild('ref') ref: ElementRef;
  ngAfterViewInit() {
    this.ref.nativeElement.style.color = 'red';
  }
}
`);
    const findings = await directDomManipulationRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it('detects appendChild', async () => {
    mockedRead.mockResolvedValue(`
parent.appendChild(child);
`);
    const findings = await directDomManipulationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores clean component code', async () => {
    mockedRead.mockResolvedValue(`
@Component({ template: '<div>{{ name }}</div>' })
class CleanComponent {
  name = 'test';
}
`);
    const findings = await directDomManipulationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores comments', async () => {
    mockedRead.mockResolvedValue(`
// document.getElementById('old');
* document.createElement('div');
`);
    const findings = await directDomManipulationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('skips test files', async () => {
    const testFile: CategorizedFile = { path: 'src/app/my.component.spec.ts', tags: ['is_typescript'] };
    const findings = await directDomManipulationRule.run(testFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
