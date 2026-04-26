import type { RuleDefinition } from '../engine/runner.js';
import { manualChangeDetectionRule } from './definitions/state/manual-change-detection.js';
import { subscribeWithoutCleanupRule } from './definitions/state/subscribe-without-cleanup.js';
import { externalSignalMutationRule } from './definitions/state/external-signal-mutation.js';
import { twoWayBindingLargeFormRule } from './definitions/state/two-way-binding-large-form.js';
import { syncInAsyncPathRule } from './definitions/perf/sync-in-async-path.js';
import { longFunctionRule } from './definitions/perf/long-function.js';
import { highCyclomaticComplexityRule } from './definitions/perf/high-cyclomatic-complexity.js';
import { listenerLeakRule } from './definitions/perf/listener-leak.js';
import { heavyComputationInRenderRule } from './definitions/perf/heavy-computation-in-render.js';
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
import { noExplicitAnyRule } from './definitions/component/no-explicit-any.js';
import { noBusinessLogicRule } from './definitions/component/no-business-logic.js';
import { missingOnPushRule } from './definitions/component/missing-onpush.js';
import { missingTrackByRule } from './definitions/component/missing-trackby.js';
import { missingIonContentRule } from './definitions/ionic/missing-ion-content.js';
import { hardcodedPlatformCheckRule } from './definitions/ionic/hardcoded-platform-check.js';
import { missingLoadingStateRule } from './definitions/ux/missing-loading-state.js';
import { missingErrorStateRule } from './definitions/ux/missing-error-state.js';
import { externalMutationRule } from './definitions/domain/external-mutation.js';
import { anemicEntityRule } from './definitions/domain/anemic-entity.js';
import { nPlusOneRule } from './definitions/perf/n-plus-one.js';
import { destructiveWithoutConfirmationRule } from './definitions/ux/destructive-without-confirmation.js';
import { redundantAriaRule } from './definitions/a11y/redundant-aria.js';
import { inlineStylesRule } from './definitions/component/inline-styles.js';
import { derivedStateAsPropertyRule } from './definitions/state/derived-state-as-property.js';
import { componentStyleLeakRule } from './definitions/scss/component-style-leak.js';
import { missingSuccessFeedbackRule } from './definitions/ux/missing-success-feedback.js';
import { missingMotionReduceRule } from './definitions/ux/missing-motion-reduce.js';
import { formNotDisabledDuringSubmitRule } from './definitions/ux/form-not-disabled-during-submit.js';
import { landmarkStructureRule } from './definitions/a11y/landmark-structure.js';
import { primitiveObsessionRule } from './definitions/domain/primitive-obsession.js';
import { missingPaginationRule } from './definitions/perf/missing-pagination.js';
import { featureEnvyRule } from './definitions/domain/feature-envy.js';
import { inappropriateIntimacyRule } from './definitions/domain/inappropriate-intimacy.js';
import { deadAbstractionRule } from './definitions/arch/dead-abstraction.js';
import { shotgunSurgeryRule } from './definitions/arch/shotgun-surgery.js';

export const ALL_RULES: RuleDefinition[] = [
  manualChangeDetectionRule,
  subscribeWithoutCleanupRule,
  externalSignalMutationRule,
  twoWayBindingLargeFormRule,
  derivedStateAsPropertyRule,
  syncInAsyncPathRule,
  longFunctionRule,
  highCyclomaticComplexityRule,
  listenerLeakRule,
  heavyComputationInRenderRule,
  nPlusOneRule,
  deepNestingRule,
  hardcodedColorRule,
  hardcodedSpacingRule,
  scssFileTooLongRule,
  componentStyleLeakRule,
  circularDependencyRule,
  layerViolationRule,
  godFileRule,
  missingAltRule,
  missingLabelRule,
  nonButtonAsButtonRule,
  redundantAriaRule,
  templateTooLongRule,
  excessiveInputOutputRule,
  noExplicitAnyRule,
  noBusinessLogicRule,
  missingOnPushRule,
  missingTrackByRule,
  inlineStylesRule,
  missingIonContentRule,
  hardcodedPlatformCheckRule,
  missingLoadingStateRule,
  missingErrorStateRule,
  missingSuccessFeedbackRule,
  destructiveWithoutConfirmationRule,
  missingMotionReduceRule,
  formNotDisabledDuringSubmitRule,
  externalMutationRule,
  anemicEntityRule,
  primitiveObsessionRule,
  landmarkStructureRule,
  missingPaginationRule,
  featureEnvyRule,
  inappropriateIntimacyRule,
  deadAbstractionRule,
  shotgunSurgeryRule,
];
