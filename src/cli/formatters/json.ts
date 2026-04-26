import type { Report } from '../../types/report.js';

export function formatJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}
