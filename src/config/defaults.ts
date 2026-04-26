import type { ParLintConfigInput } from './schema.js';

export const ANGULAR_DEFAULTS: Partial<ParLintConfigInput> = {
  realizations: {
    ux_feedback: {
      loading_pattern: 'isLoading()',
      error_pattern: 'errorState()',
    },
  },
  layers: [
    { name: 'domain', pattern: 'src/domain/**' },
    { name: 'application', pattern: 'src/application/**' },
    { name: 'infrastructure', pattern: 'src/infrastructure/**' },
    { name: 'presentation', pattern: 'src/app/**' },
  ],
  layer_rules: [
    { from: 'domain', cannot_import_from: ['application', 'infrastructure', 'presentation'] },
    { from: 'application', cannot_import_from: ['presentation'] },
  ],
};

export const IONIC_DEFAULTS: Partial<ParLintConfigInput> = {
  ...ANGULAR_DEFAULTS,
  realizations: {
    ...ANGULAR_DEFAULTS.realizations,
    ux_feedback: {
      loading_pattern: 'isLoading()',
      error_pattern: 'errorState()',
      success_pattern: 'showSuccessToast()',
    },
  },
};

export function getStackDefaults(stack: string): Partial<ParLintConfigInput> {
  switch (stack) {
    case 'angular':
      return ANGULAR_DEFAULTS;
    case 'angular-ionic':
      return IONIC_DEFAULTS;
    default:
      return {};
  }
}
