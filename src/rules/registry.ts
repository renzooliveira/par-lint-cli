import type { RuleDefinition } from '../engine/runner.js';
import { manualChangeDetectionRule } from './definitions/state/manual-change-detection.js';
import { subscribeWithoutCleanupRule } from './definitions/state/subscribe-without-cleanup.js';
import { externalSignalMutationRule } from './definitions/state/external-signal-mutation.js';
import { twoWayBindingLargeFormRule } from './definitions/state/two-way-binding-large-form.js';
import { syncInAsyncPathRule } from './definitions/perf/sync-in-async-path.js';
import { deepNestingRule } from './definitions/scss/deep-nesting.js';
import { hardcodedColorRule } from './definitions/scss/hardcoded-color.js';
import { hardcodedSpacingRule } from './definitions/scss/hardcoded-spacing.js';
import { scssFileTooLongRule } from './definitions/scss/file-too-long.js';
import { circularDependencyRule } from './definitions/arch/circular-dependency.js';
import { layerViolationRule } from './definitions/arch/layer-violation.js';
import { godFileRule } from './definitions/arch/god-file.js';
import { missingAltRule } from './definitions/a11y/missing-alt.js';
import { missingLabelRule } from './definitions/a11y/missing-label.js';
import { nonButtonAsButtonRule } from './definitions/a11y/non-button-as-button.js';
import { templateTooLongRule } from './definitions/component/template-too-long.js';
import { excessiveInputOutputRule } from './definitions/component/excessive-input-output.js';

export const ALL_RULES: RuleDefinition[] = [
  manualChangeDetectionRule,
  subscribeWithoutCleanupRule,
  externalSignalMutationRule,
  twoWayBindingLargeFormRule,
  syncInAsyncPathRule,
  deepNestingRule,
  hardcodedColorRule,
  hardcodedSpacingRule,
  scssFileTooLongRule,
  circularDependencyRule,
  layerViolationRule,
  godFileRule,
  missingAltRule,
  missingLabelRule,
  nonButtonAsButtonRule,
  templateTooLongRule,
  excessiveInputOutputRule,
];
