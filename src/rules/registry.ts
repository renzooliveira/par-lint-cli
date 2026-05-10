import type { RuleDefinition } from '../engine/runner.js';
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
import { noBusinessLogicRule } from './definitions/component/no-business-logic.js';
import { missingTrackByRule } from './definitions/component/missing-trackby.js';
import { externalMutationRule } from './definitions/domain/external-mutation.js';
import { anemicEntityRule } from './definitions/domain/anemic-entity.js';
import { nPlusOneRule } from './definitions/perf/n-plus-one.js';
import { destructiveWithoutConfirmationRule } from './definitions/ux/destructive-without-confirmation.js';
import { redundantAriaRule } from './definitions/a11y/redundant-aria.js';
import { derivedStateAsPropertyRule } from './definitions/state/derived-state-as-property.js';
import { missingSuccessFeedbackRule } from './definitions/ux/missing-success-feedback.js';
import { missingMotionReduceRule } from './definitions/ux/missing-motion-reduce.js';
import { primitiveObsessionRule } from './definitions/domain/primitive-obsession.js';
import { missingPaginationRule } from './definitions/perf/missing-pagination.js';
import { featureEnvyRule } from './definitions/domain/feature-envy.js';
import { inappropriateIntimacyRule } from './definitions/domain/inappropriate-intimacy.js';
import { deadAbstractionRule } from './definitions/arch/dead-abstraction.js';
import { shotgunSurgeryRule } from './definitions/arch/shotgun-surgery.js';
import { fileNamingConventionRule } from './definitions/naming/file-naming-convention.js';
import { missingTypeSuffixRule } from './definitions/naming/missing-type-suffix.js';
import { indexBarrelOnlyRule } from './definitions/naming/index-barrel-only.js';
import { abbreviationInIdentifierRule } from './definitions/naming/abbreviation-in-identifier.js';
import { nonDescriptiveIdentifierRule } from './definitions/naming/non-descriptive-identifier.js';
import { specFileMissingRule } from './definitions/naming/spec-file-missing.js';
import { inconsistentObservableSuffixRule } from './definitions/naming/inconsistent-observable-suffix.js';
import { missingStyleFileRule } from './definitions/component/missing-style-file.js';
import { filesNotColocatedRule } from './definitions/component/files-not-colocated.js';
import { multipleComponentsPerFileRule } from './definitions/component/multiple-components-per-file.js';
import { selectorPrefixMismatchRule } from './definitions/component/selector-prefix-mismatch.js';
import { deeplyNestedConditionalsRule } from './definitions/template/deeply-nested-conditionals.js';
import { duplicateAttributeRule } from './definitions/template/duplicate-attribute.js';
import { eventWithoutKeyboardRule } from './definitions/template/event-without-keyboard.js';
import { ionicGridWithoutResponsiveSizesRule } from './definitions/responsive/ionic-grid-without-responsive-sizes.js';
import { fixedWidthContainerRule } from './definitions/responsive/fixed-width-container.js';
import { hardcodedPxFontRule } from './definitions/responsive/hardcoded-px-font.js';
import { noOverflowHandlingRule } from './definitions/responsive/no-overflow-handling.js';
import { imageWithoutMaxWidthRule } from './definitions/responsive/image-without-max-width.js';
import { fixedHeightContentRule } from './definitions/responsive/fixed-height-content.js';
import { fontDisplayMissingRule } from './definitions/perf/font-display-missing.js';
import { duplicateCssClassRule } from './definitions/duplication/duplicate-css-class.js';
import { noRelativeParentBeyondTwoRule } from './definitions/imports/no-relative-parent-beyond-two.js';
import { sortedImportsRule } from './definitions/imports/sorted-imports.js';
import { nestedSubscribeRule } from './definitions/rxjs/nested-subscribe.js';
import { subscribeInConstructorRule } from './definitions/rxjs/subscribe-in-constructor.js';
import { missingErrorHandlerRule } from './definitions/rxjs/missing-error-handler.js';
import { signalReadAfterAwaitRule } from './definitions/signals/signal-read-after-await.js';
import { missingAsReadonlyRule } from './definitions/signals/missing-asreadonly.js';
import { computedSideEffectRule } from './definitions/signals/computed-side-effect.js';
import { effectWithoutCleanupRule } from './definitions/signals/effect-without-cleanup.js';
import { tooManyAssertionsRule } from './definitions/test/too-many-assertions.js';
import { noAssertionRule } from './definitions/test/no-assertion.js';
import { emptyCatchRule } from './definitions/error/empty-catch.js';
import { catchOnlyConsoleRule } from './definitions/error/catch-only-console.js';
import { commentedOutCodeRule } from './definitions/hygiene/commented-out-code.js';
import { unusedImportRule } from './definitions/hygiene/unused-import.js';
import { deadCodeAfterReturnRule } from './definitions/hygiene/dead-code-after-return.js';
import { constructorInjectionRule } from './definitions/component/constructor-injection.js';
import { typeAssertionWithoutGuardRule } from './definitions/typescript/type-assertion-without-guard.js';
import { mutatingArrayMethodRule } from './definitions/fp/mutating-array-method.js';
import { lawOfDemeterRule } from './definitions/domain/law-of-demeter.js';
import { preferIonComponentRule } from './definitions/ionic/prefer-ion-component.js';
import { ngoninitForDataLoadingRule } from './definitions/ionic/ngoninit-for-data-loading.js';
import { ionicmoduleInStandaloneRule } from './definitions/ionic/ionicmodule-in-standalone.js';
import { tosignalMissingInitialvalueRule } from './definitions/signals/tosignal-missing-initialvalue.js';
import { subscribeInServiceRule } from './definitions/rxjs/subscribe-in-service.js';
import { subjectNeverCompletedRule } from './definitions/rxjs/subject-never-completed.js';
import { noImportantRule } from './definitions/scss/no-important.js';
import { functionTooManyParamsRule } from './definitions/typescript/function-too-many-params.js';
import { exhaustiveSwitchRule } from './definitions/typescript/exhaustive-switch.js';
import { elseAfterReturnRule } from './definitions/hygiene/else-after-return.js';
import { methodCallInTemplateRule } from './definitions/template/method-call-in-template.js';
import { forWithoutEmptyRule } from './definitions/template/for-without-empty.js';
import { letReassignmentRule } from './definitions/fp/let-reassignment.js';
import { varInLoopRule } from './definitions/fp/var-in-loop.js';
import { giantTestRule } from './definitions/test/giant-test.js';
import { classTooManyMethodsRule } from './definitions/arch/class-too-many-methods.js';
import { classTooManyFieldsRule } from './definitions/arch/class-too-many-fields.js';
import { missingPathmatchFullRule } from './definitions/routing/missing-pathmatch-full.js';
import { wildcardNotLastRule } from './definitions/routing/wildcard-not-last.js';
import { imperativeLoopRule } from './definitions/fp/imperative-loop.js';
import { nondeterministicInPureRule } from './definitions/fp/nondeterministic-in-pure.js';
import { assertInCatchOnlyRule } from './definitions/test/assert-in-catch-only.js';
import { highEntropyStringRule } from './definitions/security/high-entropy-string.js';
import { frameworkInDomainRule } from './definitions/arch/framework-in-domain.js';
import { deepInheritanceChainRule } from './definitions/arch/deep-inheritance-chain.js';
import { eventListenerWithoutDisposeRule } from './definitions/perf/event-listener-without-dispose.js';
import { classFileNameMismatchRule } from './definitions/naming/class-file-name-mismatch.js';
import { genericNameInContextRule } from './definitions/naming/generic-name-in-context.js';
import { similarBlockRule } from './definitions/duplication/similar-block.js';
import { hardcodedSecretRule } from './definitions/security/hardcoded-secret.js';
import { mutableStateInComputedRule } from './definitions/state/mutable-state-in-computed.js';
import { hardcodedTextRule } from './definitions/template/hardcoded-text.js';
import { dataClumpsRule } from './definitions/domain/data-clumps.js';
import { middleManRule } from './definitions/domain/middle-man.js';
import { temporaryFieldRule } from './definitions/domain/temporary-field.js';
import { noCrossSliceImportRule } from './definitions/arch/no-cross-slice-import.js';
import { mixedConcernsInDirectoryRule } from './definitions/arch/mixed-concerns-in-directory.js';
import { wrongLifecycleRule } from './definitions/ionic/wrong-lifecycle.js';
import { missingRefresherRule } from './definitions/ionic/missing-refresher.js';
import { preferIonGridRule } from './definitions/ionic/prefer-ion-grid.js';
import { enforcePathAliasRule } from './definitions/imports/enforce-path-alias.js';
import { noCircularTypeImportRule } from './definitions/imports/no-circular-type-import.js';
import { contextMismatchRule } from './definitions/naming/context-mismatch.js';
import { fileClassMismatchRule } from './definitions/naming/file-class-mismatch.js';
import { touchTargetTooSmallRule } from './definitions/responsive/touch-target-too-small.js';
import { noObjectMutationRule } from './definitions/fp/no-object-mutation.js';
import { preferReadonlyPropertyRule } from './definitions/fp/prefer-readonly-property.js';
import { preferReadonlyParameterRule } from './definitions/fp/prefer-readonly-parameter.js';
import { preferFrameworkSolutionRule } from './definitions/duplication/prefer-framework-solution.js';
import { structuralCloneRule } from './definitions/duplication/structural-clone.js';
import { duplicateTypeShapeRule } from './definitions/duplication/duplicate-type-shape.js';
import { similarScssBlockRule } from './definitions/duplication/similar-scss-block.js';
import { preferExistingUtilityRule } from './definitions/duplication/prefer-existing-utility.js';
import { preferPureFunctionRule } from './definitions/fp/prefer-pure-function.js';
import { similarComponentRule } from './definitions/duplication/similar-component.js';
import { multipleConceptsPerFileRule } from './definitions/arch/multiple-concepts-per-file.js';
import { stateNotInUrlRule } from './definitions/ux/state-not-in-url.js';
import { textOverflowUnhandledRule } from './definitions/component/text-overflow-unhandled.js';
import { missingTabularNumsRule } from './definitions/scss/missing-tabular-nums.js';
import { missingTranslateNoRule } from './definitions/i18n/missing-translate-no.js';
import { runtimeStateCheckRule } from './definitions/domain/runtime-state-check.js';
import { largeListNotVirtualizedRule } from './definitions/perf/large-list-not-virtualized.js';
import { speculativeGeneralityRule } from './definitions/domain/speculative-generality.js';
import { customWithoutJustificationRule } from './definitions/component/custom-without-justification.js';
import { crossAggregateDirectCallRule } from './definitions/arch/cross-aggregate-direct-call.js';
import { arrayAsCollectionAnemicRule } from './definitions/domain/array-as-collection-anemic.js';

export const ALL_RULES: RuleDefinition[] = [
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
  circularDependencyRule,
  layerViolationRule,
  godFileRule,
  missingAltRule,
  missingLabelRule,
  nonButtonAsButtonRule,
  redundantAriaRule,
  templateTooLongRule,
  excessiveInputOutputRule,
  noBusinessLogicRule,
  missingTrackByRule,
  missingSuccessFeedbackRule,
  destructiveWithoutConfirmationRule,
  missingMotionReduceRule,
  externalMutationRule,
  anemicEntityRule,
  primitiveObsessionRule,
  missingPaginationRule,
  featureEnvyRule,
  inappropriateIntimacyRule,
  deadAbstractionRule,
  shotgunSurgeryRule,
  fileNamingConventionRule,
  missingTypeSuffixRule,
  indexBarrelOnlyRule,
  abbreviationInIdentifierRule,
  nonDescriptiveIdentifierRule,
  specFileMissingRule,
  inconsistentObservableSuffixRule,
  missingStyleFileRule,
  filesNotColocatedRule,
  multipleComponentsPerFileRule,
  selectorPrefixMismatchRule,
  deeplyNestedConditionalsRule,
  duplicateAttributeRule,
  eventWithoutKeyboardRule,
  ionicGridWithoutResponsiveSizesRule,
  fixedWidthContainerRule,
  hardcodedPxFontRule,
  noOverflowHandlingRule,
  imageWithoutMaxWidthRule,
  fixedHeightContentRule,
  fontDisplayMissingRule,
  duplicateCssClassRule,
  noRelativeParentBeyondTwoRule,
  sortedImportsRule,
  nestedSubscribeRule,
  subscribeInConstructorRule,
  missingErrorHandlerRule,
  signalReadAfterAwaitRule,
  missingAsReadonlyRule,
  computedSideEffectRule,
  effectWithoutCleanupRule,
  tooManyAssertionsRule,
  noAssertionRule,
  emptyCatchRule,
  catchOnlyConsoleRule,
  commentedOutCodeRule,
  unusedImportRule,
  deadCodeAfterReturnRule,
  constructorInjectionRule,
  typeAssertionWithoutGuardRule,
  mutatingArrayMethodRule,
  lawOfDemeterRule,
  preferIonComponentRule,
  ngoninitForDataLoadingRule,
  ionicmoduleInStandaloneRule,
  tosignalMissingInitialvalueRule,
  subscribeInServiceRule,
  subjectNeverCompletedRule,
  noImportantRule,
  functionTooManyParamsRule,
  exhaustiveSwitchRule,
  elseAfterReturnRule,
  methodCallInTemplateRule,
  forWithoutEmptyRule,
  letReassignmentRule,
  varInLoopRule,
  giantTestRule,
  classTooManyMethodsRule,
  classTooManyFieldsRule,
  missingPathmatchFullRule,
  wildcardNotLastRule,
  imperativeLoopRule,
  nondeterministicInPureRule,
  assertInCatchOnlyRule,
  highEntropyStringRule,
  frameworkInDomainRule,
  deepInheritanceChainRule,
  eventListenerWithoutDisposeRule,
  classFileNameMismatchRule,
  genericNameInContextRule,
  similarBlockRule,
  hardcodedSecretRule,
  mutableStateInComputedRule,
  hardcodedTextRule,
  dataClumpsRule,
  middleManRule,
  temporaryFieldRule,
  noCrossSliceImportRule,
  mixedConcernsInDirectoryRule,
  wrongLifecycleRule,
  missingRefresherRule,
  preferIonGridRule,
  enforcePathAliasRule,
  noCircularTypeImportRule,
  contextMismatchRule,
  fileClassMismatchRule,
  touchTargetTooSmallRule,
  noObjectMutationRule,
  preferReadonlyPropertyRule,
  preferReadonlyParameterRule,
  preferFrameworkSolutionRule,
  structuralCloneRule,
  duplicateTypeShapeRule,
  similarScssBlockRule,
  preferExistingUtilityRule,
  preferPureFunctionRule,
  similarComponentRule,
  multipleConceptsPerFileRule,
  stateNotInUrlRule,
  textOverflowUnhandledRule,
  missingTabularNumsRule,
  missingTranslateNoRule,
  runtimeStateCheckRule,
  largeListNotVirtualizedRule,
  speculativeGeneralityRule,
  customWithoutJustificationRule,
  crossAggregateDirectCallRule,
  arrayAsCollectionAnemicRule,
];
