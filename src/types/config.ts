export type Stack = 'angular' | 'angular-ionic' | 'react' | 'dotnet' | 'mixed';

export interface LayerDefinition {
  name: string;
  pattern: string;
}

export interface LayerRule {
  from: string;
  cannot_import_from: string[];
}

export interface RuleConfig {
  enabled: boolean;
  severity?: 'info' | 'warning' | 'error';
  exclude?: string[];
  [key: string]: unknown;
}

export interface SuppressionPolicy {
  require_reason: boolean;
  min_reason_length: number;
  reviewable: boolean;
}

export interface OutputConfig {
  formats: Array<'json' | 'sarif' | 'markdown'>;
  json_path: string;
  sarif_path: string;
  markdown_path: string;
  state_path: string;
}

export interface PerformanceConfig {
  cache_enabled: boolean;
  parallel_workers: number;
  incremental: 'auto' | 'always' | 'never';
}

export interface ParLintConfig {
  schema_version: string;

  project: {
    name: string;
    stack: Stack;
  };

  realizations: Record<string, Record<string, string>>;

  layers: LayerDefinition[];
  layer_rules: LayerRule[];

  rules: Record<string, RuleConfig>;

  suppression: SuppressionPolicy;

  output: OutputConfig;

  performance: PerformanceConfig;
}
