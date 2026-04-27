import { describe, it, expect } from 'vitest';
import { todoWithoutTicketRule } from './todo-without-ticket.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('hygiene/todo-without-ticket', () => {
  it('flags TODO/FIXME/HACK without ticket reference', async () => {
    const file = categorizeFile('violations/hygiene/todo-without-ticket.service.ts');
    const findings = await todoWithoutTicketRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('hygiene/todo-without-ticket');
  });

  it('passes TODOs with ticket references', async () => {
    const file = categorizeFile('valid/hygiene/todo-with-ticket.service.ts');
    const findings = await todoWithoutTicketRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
