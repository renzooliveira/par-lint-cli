import type { Report } from '../../types/report.js';
import type { Finding } from '../../types/finding.js';

interface SarifLog {
  $schema: string;
  version: string;
  runs: SarifRun[];
}

interface SarifRun {
  tool: { driver: { name: string; version: string; rules: SarifRule[] } };
  results: SarifResult[];
}

interface SarifRule {
  id: string;
  shortDescription: { text: string };
  defaultConfiguration: { level: string };
}

interface SarifResult {
  ruleId: string;
  level: string;
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region: { startLine: number; startColumn?: number; endLine?: number; endColumn?: number };
    };
  }>;
}

function severityToLevel(severity: string): string {
  switch (severity) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'note';
    default: return 'note';
  }
}

function findingToResult(finding: Finding): SarifResult {
  return {
    ruleId: finding.rule_id,
    level: severityToLevel(finding.severity),
    message: { text: finding.message },
    locations: [{
      physicalLocation: {
        artifactLocation: { uri: finding.file },
        region: {
          startLine: finding.line,
          ...(finding.column != null && { startColumn: finding.column }),
          ...(finding.end_line != null && { endLine: finding.end_line }),
          ...(finding.end_column != null && { endColumn: finding.end_column }),
        },
      },
    }],
  };
}

export function formatSarif(report: Report): string {
  const ruleIds = [...new Set(report.findings.map((f) => f.rule_id))];

  const rules: SarifRule[] = ruleIds.map((id) => {
    const sample = report.findings.find((f) => f.rule_id === id)!;
    return {
      id,
      shortDescription: { text: sample.source_principle },
      defaultConfiguration: { level: severityToLevel(sample.severity) },
    };
  });

  const sarif: SarifLog = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'par-lint',
          version: report.par_lint_version,
          rules,
        },
      },
      results: report.findings.map(findingToResult),
    }],
  };

  return JSON.stringify(sarif, null, 2);
}
