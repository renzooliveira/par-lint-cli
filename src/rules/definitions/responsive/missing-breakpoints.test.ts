import { describe, it, expect, vi } from 'vitest';
import { missingBreakpointsRule } from './missing-breakpoints.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('responsive/missing-breakpoints', () => {
  it('detects flex layout without media query', async () => {
    const file: CategorizedFile = { path: 'src/app/my.component.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.container {
  display: flex;
  gap: 16px;
}
`);
    const findings = await missingBreakpointsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('display: flex');
  });

  it('ignores layout with media query', async () => {
    const file: CategorizedFile = { path: 'src/app/my.component.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.container {
  display: flex;
  gap: 16px;
}
@media (max-width: 768px) {
  .container { flex-direction: column; }
}
`);
    const findings = await missingBreakpointsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores layout with container query', async () => {
    const file: CategorizedFile = { path: 'src/app/my.component.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.wrapper { container-type: inline-size; }
.container {
  display: grid;
}
@container (min-width: 400px) {
  .container { grid-template-columns: 1fr 1fr; }
}
`);
    const findings = await missingBreakpointsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores global/variables files', async () => {
    const file: CategorizedFile = { path: 'src/app/styles/global.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`.flex { display: flex; }`);
    const findings = await missingBreakpointsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
