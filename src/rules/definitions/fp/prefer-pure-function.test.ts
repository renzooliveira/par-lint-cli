import { describe, it, expect, vi } from 'vitest';
import { preferPureFunctionRule } from './prefer-pure-function.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/utils/math.utils.ts', tags: ['is_typescript'] };

describe('functional/prefer-pure-function', () => {
  it('detects standalone function accessing this.*', async () => {
    mockedRead.mockResolvedValue(`
function calculateTotal() {
  return this.items.reduce((sum, i) => sum + i.price, 0);
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('calculateTotal');
    expect(findings[0]!.message).toContain('this');
  });

  it('detects function modifying global state', async () => {
    mockedRead.mockResolvedValue(`
let counter = 0;
function increment() {
  counter++;
  return counter;
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('increment');
  });

  it('detects function writing to document/window', async () => {
    mockedRead.mockResolvedValue(`
function setTitle(title: string) {
  document.title = title;
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('setTitle');
  });

  it('detects function calling console.log', async () => {
    mockedRead.mockResolvedValue(`
function processData(data: number[]) {
  console.log('processing', data);
  return data.map(x => x * 2);
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('processData');
  });

  it('ignores pure functions', async () => {
    mockedRead.mockResolvedValue(`
function add(a: number, b: number): number {
  return a + b;
}

function formatName(first: string, last: string): string {
  const full = first + ' ' + last;
  return full.trim();
}

const multiply = (a: number, b: number) => a * b;
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores class methods (they legitimately use this)', async () => {
    mockedRead.mockResolvedValue(`
class UserService {
  private users: User[] = [];

  getUsers() {
    return this.users;
  }

  addUser(user: User) {
    this.users.push(user);
  }
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores service/component files', async () => {
    const serviceFile: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function helper() {
  this.doStuff();
}
`);
    const findings = await preferPureFunctionRule.run(serviceFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects function with fetch/XMLHttpRequest side effect', async () => {
    mockedRead.mockResolvedValue(`
function loadData(url: string) {
  return fetch(url).then(r => r.json());
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores spec/test files', async () => {
    const testFile: CategorizedFile = { path: 'src/app/utils.spec.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function setup() {
  document.body.innerHTML = '<div></div>';
}
`);
    const findings = await preferPureFunctionRule.run(testFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects function writing to localStorage', async () => {
    mockedRead.mockResolvedValue(`
function saveToken(token: string) {
  localStorage.setItem('token', token);
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('detects arrow function assigned to const with side effects', async () => {
    mockedRead.mockResolvedValue(`
const resetState = () => {
  globalState.count = 0;
  globalState.items = [];
};
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('resetState');
  });

  it('ignores arrow callbacks inside methods', async () => {
    mockedRead.mockResolvedValue(`
function getNames(users: User[]): string[] {
  return users.map(u => u.name);
}
`);
    const findings = await preferPureFunctionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
