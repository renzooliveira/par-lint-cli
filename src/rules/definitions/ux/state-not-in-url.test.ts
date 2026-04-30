import { describe, it, expect, vi } from 'vitest';
import { stateNotInUrlRule } from './state-not-in-url.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ux/state-not-in-url', () => {
  it('detects navigable state not synced with URL', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
@Component({ template: '' })
export class OrdersPage {
  currentTab = signal('all');
  filterStatus = signal('active');
  currentPage = signal(1);
}
`);
    const findings = await stateNotInUrlRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(3);
  });

  it('ignores state synced with ActivatedRoute', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
@Component({ template: '' })
export class OrdersPage {
  currentTab = signal('all');

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(p => this.currentTab.set(p['tab']));
  }
}
`);
    const findings = await stateNotInUrlRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-navigable state names', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
@Component({ template: '' })
export class OrdersPage {
  isLoading = signal(false);
  errorMessage = signal('');
  items = signal([]);
}
`);
    const findings = await stateNotInUrlRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-page/component files', async () => {
    const file: CategorizedFile = { path: 'src/app/services/auth.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class AuthService {
  currentTab = signal('login');
}
`);
    const findings = await stateNotInUrlRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores state with Router.navigate present', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/list/list.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
@Component({ template: '' })
export class ListPage {
  currentPage = signal(1);

  goToPage(n: number) {
    this.currentPage.set(n);
    this.router.navigate([], { queryParams: { page: n } });
  }
}
`);
    const findings = await stateNotInUrlRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects filter/sort/search state without URL sync', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/products/products.component.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
@Component({ template: '' })
export class ProductsComponent {
  searchQuery = '';
  sortBy = 'name';
  selectedCategory = 'all';
}
`);
    const findings = await stateNotInUrlRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(3);
  });
});
