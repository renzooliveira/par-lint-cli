import { describe, it, expect, vi } from 'vitest';
import { touchTargetTooSmallRule } from './touch-target-too-small.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/my.component.scss', tags: ['is_scss'] };

describe('responsive/touch-target-too-small', () => {
  it('detects button smaller than 44px', async () => {
    mockedRead.mockResolvedValue(`
button {
  width: 32px;
  height: 32px;
}
`);
    const findings = await touchTargetTooSmallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
  });

  it('detects small rem value', async () => {
    mockedRead.mockResolvedValue(`
.btn {
  min-height: 2rem;
}
`);
    const findings = await touchTargetTooSmallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores adequate button size', async () => {
    mockedRead.mockResolvedValue(`
button {
  width: 48px;
  height: 48px;
}
`);
    const findings = await touchTargetTooSmallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-interactive selectors', async () => {
    mockedRead.mockResolvedValue(`
.icon {
  width: 16px;
  height: 16px;
}
`);
    const findings = await touchTargetTooSmallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
