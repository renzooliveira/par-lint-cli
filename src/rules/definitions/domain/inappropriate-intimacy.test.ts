import { describe, it, expect, vi } from 'vitest';
import { inappropriateIntimacyRule } from './inappropriate-intimacy.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.ts', tags: ['is_typescript'] };

describe('domain/inappropriate-intimacy', () => {
  it('detects two classes with excessive cross-references', async () => {
    mockedRead.mockResolvedValue(`
import { Customer } from './customer';

class Order {
  process(c: Customer) {
    c.name;
    c.email;
    c.phone;
    c.address;
    c.status;
    c.validate();
  }
}
`);
    const findings = await inappropriateIntimacyRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('Customer');
  });

  it('ignores classes with few references', async () => {
    mockedRead.mockResolvedValue(`
import { Customer } from './customer';

class Order {
  process(c: Customer) {
    c.name;
    c.email;
  }
}
`);
    const findings = await inappropriateIntimacyRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
