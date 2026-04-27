import { describe, it, expect, vi } from 'vitest';
import { similarScssBlockRule } from './similar-scss-block.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/my.component.scss', tags: ['is_scss'] };

describe('duplication/similar-scss-block', () => {
  it('detects blocks with identical properties', async () => {
    mockedRead.mockResolvedValue(`
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
`);
    const findings = await similarScssBlockRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('.card-header');
    expect(findings[0]!.message).toContain('.card-footer');
  });

  it('ignores blocks with different properties', async () => {
    mockedRead.mockResolvedValue(`
.header {
  display: flex;
  color: red;
  padding: 8px;
}

.footer {
  display: grid;
  color: blue;
  margin: 16px;
}
`);
    const findings = await similarScssBlockRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores blocks with fewer than 3 properties', async () => {
    mockedRead.mockResolvedValue(`
.a {
  color: red;
  padding: 8px;
}

.b {
  color: red;
  padding: 8px;
}
`);
    const findings = await similarScssBlockRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
