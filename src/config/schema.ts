import { z } from 'zod';

const stackSchema = z.enum(['angular', 'angular-ionic', 'react', 'dotnet', 'mixed']);

const layerDefinitionSchema = z.object({
  name: z.string(),
  pattern: z.string(),
});

const layerRuleSchema = z.object({
  from: z.string(),
  cannot_import_from: z.array(z.string()),
});

const ruleConfigSchema = z.looseObject({
  enabled: z.boolean().default(true),
  severity: z.enum(['info', 'warning', 'error']).optional(),
});

const suppressionPolicySchema = z.object({
  require_reason: z.boolean().default(true),
  min_reason_length: z.number().default(20),
  reviewable: z.boolean().default(true),
});

const outputConfigSchema = z.object({
  formats: z.array(z.enum(['json', 'sarif', 'markdown'])).default(['json']),
  json_path: z.string().default('.par-lint/findings.json'),
  sarif_path: z.string().default('.par-lint/findings.sarif'),
  markdown_path: z.string().default('.par-lint/report.md'),
  state_path: z.string().default('.par-lint/state.json'),
});

const performanceConfigSchema = z.object({
  cache_enabled: z.boolean().default(true),
  parallel_workers: z.number().default(4),
  incremental: z.enum(['auto', 'always', 'never']).default('auto'),
});

export const parLintConfigSchema = z.object({
  schema_version: z.string().default('1.0'),

  project: z.object({
    name: z.string(),
    stack: stackSchema.default('angular'),
  }),

  realizations: z.record(z.string(), z.record(z.string(), z.string())).default({}),

  layers: z.array(layerDefinitionSchema).default([]),
  layer_rules: z.array(layerRuleSchema).default([]),

  rules: z.record(z.string(), ruleConfigSchema).default({}),

  suppression: suppressionPolicySchema.default(() => ({
    require_reason: true,
    min_reason_length: 20,
    reviewable: true,
  })),

  output: outputConfigSchema.default(() => ({
    formats: ['json'] as ('json' | 'sarif' | 'markdown')[],
    json_path: '.par-lint/findings.json',
    sarif_path: '.par-lint/findings.sarif',
    markdown_path: '.par-lint/report.md',
    state_path: '.par-lint/state.json',
  })),

  performance: performanceConfigSchema.default(() => ({
    cache_enabled: true,
    parallel_workers: 4,
    incremental: 'auto' as const,
  })),
});

export type ParLintConfigInput = z.input<typeof parLintConfigSchema>;
