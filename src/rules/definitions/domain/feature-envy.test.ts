import { describe, it, expect, vi } from 'vitest';
import { featureEnvyRule } from './feature-envy.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('domain/feature-envy', () => {
  it('detects method accessing many props of another object', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  process(customer: Customer) {
    const name = customer.name;
    const email = customer.email;
    const phone = customer.phone;
    const address = customer.address;
    return { name, email, phone, address };
  }
}
`);
    const findings = await featureEnvyRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('customer');
  });

  it('ignores methods with few property accesses', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  getName(customer: Customer) {
    return customer.name;
  }
}
`);
    const findings = await featureEnvyRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores this references', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  process() {
    this.name;
    this.email;
    this.phone;
    this.address;
  }
}
`);
    const findings = await featureEnvyRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
