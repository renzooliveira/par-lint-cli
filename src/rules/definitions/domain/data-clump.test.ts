import { describe, it, expect, vi } from 'vitest';
import { dataClumpRule } from './data-clump.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('domain/data-clump', () => {
  it('detects parameter groups appearing in 3+ functions', async () => {
    const file: CategorizedFile = { path: 'src/app/services/geo.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function calculateDistance(lat: number, lng: number, altitude: number) {}
function formatCoords(lat: number, lng: number, altitude: number) {}
function validatePosition(lat: number, lng: number, altitude: number) {}
`);
    const findings = await dataClumpRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('lat');
    expect(findings[0]!.message).toContain('lng');
    expect(findings[0]!.message).toContain('altitude');
  });

  it('ignores parameter groups in fewer than 3 functions', async () => {
    const file: CategorizedFile = { path: 'src/app/services/geo.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function calculateDistance(lat: number, lng: number) {}
function formatCoords(lat: number, lng: number) {}
`);
    const findings = await dataClumpRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores functions with fewer than 3 shared params', async () => {
    const file: CategorizedFile = { path: 'src/app/services/user.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function createUser(name: string, email: string) {}
function updateUser(name: string, email: string) {}
function deleteUser(name: string, email: string) {}
`);
    const findings = await dataClumpRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores spec/test files', async () => {
    const file: CategorizedFile = { path: 'src/app/geo.spec.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function a(lat: number, lng: number, alt: number) {}
function b(lat: number, lng: number, alt: number) {}
function c(lat: number, lng: number, alt: number) {}
`);
    const findings = await dataClumpRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects clumps in class methods too', async () => {
    const file: CategorizedFile = { path: 'src/app/services/shipping.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class ShippingService {
  calculateRate(weight: number, width: number, height: number) {}
  estimateDelivery(weight: number, width: number, height: number) {}
  validatePackage(weight: number, width: number, height: number) {}
}
`);
    const findings = await dataClumpRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });
});
