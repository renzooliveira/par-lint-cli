import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Finding, FindingStatus } from '../types/finding.js';

interface FindingState {
  finding_id: string;
  rule_id: string;
  file: string;
  line: number;
  first_seen: string;
  last_seen: string;
}

interface StateFile {
  schema_version: string;
  last_execution: {
    timestamp: string;
    par_lint_version: string;
  };
  active_findings: Record<string, FindingState>;
}

export interface ReconcileResult {
  findings: Finding[];
  resolved: FindingState[];
}

export async function loadState(statePath: string): Promise<StateFile | null> {
  try {
    const content = await readFile(statePath, 'utf-8');
    return JSON.parse(content) as StateFile;
  } catch {
    return null;
  }
}

export async function saveState(statePath: string, findings: Finding[]): Promise<void> {
  const dir = path.dirname(statePath);
  await mkdir(dir, { recursive: true });

  const state: StateFile = {
    schema_version: '1.0',
    last_execution: {
      timestamp: new Date().toISOString(),
      par_lint_version: '0.2.0',
    },
    active_findings: {},
  };

  for (const finding of findings) {
    state.active_findings[finding.finding_id] = {
      finding_id: finding.finding_id,
      rule_id: finding.rule_id,
      file: finding.file,
      line: finding.line,
      first_seen: finding.first_seen,
      last_seen: finding.last_seen,
    };
  }

  await writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function reconcileFindings(
  currentFindings: Finding[],
  previousState: StateFile | null,
): ReconcileResult {
  if (!previousState) {
    return {
      findings: currentFindings.map((f) => ({ ...f, status: 'new' as FindingStatus })),
      resolved: [],
    };
  }

  const previousIds = new Set(Object.keys(previousState.active_findings));

  const findings = currentFindings.map((finding) => {
    const prev = previousState.active_findings[finding.finding_id];
    if (prev) {
      previousIds.delete(finding.finding_id);
      return {
        ...finding,
        status: 'persistent' as FindingStatus,
        first_seen: prev.first_seen,
      };
    }
    return { ...finding, status: 'new' as FindingStatus };
  });

  const resolved: FindingState[] = [];
  for (const id of previousIds) {
    const prev = previousState.active_findings[id];
    if (prev) {
      resolved.push(prev);
    }
  }

  return { findings, resolved };
}
