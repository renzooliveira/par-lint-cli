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
import { fileNamingConventionRule } from './definitions/naming/file-naming-convention.js';
import { missingTypeSuffixRule } from './definitions/naming/missing-type-suffix.js';
import { indexBarrelOnlyRule } from './definitions/naming/index-barrel-only.js';
import { interfacePrefixRule } from './definitions/naming/interface-prefix.js';
import { hungarianNotationRule } from './definitions/naming/hungarian-notation.js';
import { underscorePrefixNonPrivateRule } from './definitions/naming/underscore-prefix-non-private.js';
import { abbreviationInIdentifierRule } from './definitions/naming/abbreviation-in-identifier.js';
import { nonDescriptiveIdentifierRule } from './definitions/naming/non-descriptive-identifier.js';
import { reservedWordCollisionRule } from './definitions/naming/reserved-word-collision.js';
import { specFileMissingRule } from './definitions/naming/spec-file-missing.js';
import { inconsistentObservableSuffixRule } from './definitions/naming/inconsistent-observable-suffix.js';
import { cssClassNotBemRule } from './definitions/naming/css-class-not-bem.js';
import { scssVariableNotKebabRule } from './definitions/naming/scss-variable-not-kebab.js';
import { cssCustomPropertyNoNamespaceRule } from './definitions/naming/css-custom-property-no-namespace.js';
import { missingStyleFileRule } from './definitions/component/missing-style-file.js';
import { filesNotColocatedRule } from './definitions/component/files-not-colocated.js';
import { multipleComponentsPerFileRule } from './definitions/component/multiple-components-per-file.js';
import { missingEncapsulationStrategyRule } from './definitions/component/missing-encapsulation-strategy.js';
import { selectorPrefixMismatchRule } from './definitions/component/selector-prefix-mismatch.js';
import { buttonMissingTypeRule } from './definitions/template/button-missing-type.js';
import { imgMissingDimensionsRule } from './definitions/template/img-missing-dimensions.js';
import { deeplyNestedConditionalsRule } from './definitions/template/deeply-nested-conditionals.js';
import { missingNgSrcRule } from './definitions/template/missing-ng-src.js';
import { duplicateAttributeRule } from './definitions/template/duplicate-attribute.js';
import { eventWithoutKeyboardRule } from './definitions/template/event-without-keyboard.js';
import { ionicGridWithoutResponsiveSizesRule } from './definitions/responsive/ionic-grid-without-responsive-sizes.js';
import { magicNumberInScssRule } from './definitions/naming/magic-number-in-scss.js';
import { fixedWidthContainerRule } from './definitions/responsive/fixed-width-container.js';
import { hardcodedPxFontRule } from './definitions/responsive/hardcoded-px-font.js';
import { noOverflowHandlingRule } from './definitions/responsive/no-overflow-handling.js';
import { imageWithoutMaxWidthRule } from './definitions/responsive/image-without-max-width.js';
import { fixedHeightContentRule } from './definitions/responsive/fixed-height-content.js';
import { fontDisplayMissingRule } from './definitions/perf/font-display-missing.js';
import { duplicateCssClassRule } from './definitions/duplication/duplicate-css-class.js';
import { noRelativeParentBeyondTwoRule } from './definitions/imports/no-relative-parent-beyond-two.js';
import { enforceBarrelImportRule } from './definitions/imports/enforce-barrel-import.js';
import { sortedImportsRule } from './definitions/imports/sorted-imports.js';
import { nestedSubscribeRule } from './definitions/rxjs/nested-subscribe.js';
import { subscribeInConstructorRule } from './definitions/rxjs/subscribe-in-constructor.js';
import { topromiseDeprecatedRule } from './definitions/rxjs/topromise-deprecated.js';
import { missingErrorHandlerRule } from './definitions/rxjs/missing-error-handler.js';
import { observableInTemplateCallRule } from './definitions/rxjs/observable-in-template-call.js';
import { signalReadAfterAwaitRule } from './definitions/signals/signal-read-after-await.js';
import { missingAsReadonlyRule } from './definitions/signals/missing-asreadonly.js';
import { computedSideEffectRule } from './definitions/signals/computed-side-effect.js';
import { effectWithoutCleanupRule } from './definitions/signals/effect-without-cleanup.js';
import { emptySpecRule } from './definitions/test/empty-spec.js';
import { noFocusedTestRule } from './definitions/test/no-focused-test.js';
import { tooManyAssertionsRule } from './definitions/test/too-many-assertions.js';
import { noAssertionRule } from './definitions/test/no-assertion.js';
import { emptyCatchRule } from './definitions/error/empty-catch.js';
import { catchOnlyConsoleRule } from './definitions/error/catch-only-console.js';
import { swallowedPromiseRule } from './definitions/error/swallowed-promise.js';
import { genericErrorMessageRule } from './definitions/error/generic-error-message.js';
import { consoleLogInProductionRule } from './definitions/hygiene/console-log-in-production.js';
import { commentedOutCodeRule } from './definitions/hygiene/commented-out-code.js';
import { todoWithoutTicketRule } from './definitions/hygiene/todo-without-ticket.js';
import { debuggerStatementRule } from './definitions/hygiene/debugger-statement.js';
import { unusedImportRule } from './definitions/hygiene/unused-import.js';
import { deadCodeAfterReturnRule } from './definitions/hygiene/dead-code-after-return.js';
import { deprecatedInputDecoratorRule } from './definitions/component/deprecated-input-decorator.js';
import { deprecatedOutputDecoratorRule } from './definitions/component/deprecated-output-decorator.js';
import { constructorInjectionRule } from './definitions/component/constructor-injection.js';
import { deprecatedHostDecoratorRule } from './definitions/component/deprecated-host-decorator.js';
import { deprecatedStructuralDirectiveRule } from './definitions/template/deprecated-structural-directive.js';
import { forMissingTrackRule } from './definitions/template/for-missing-track.js';
import { ngclassInsteadOfClassBindingRule } from './definitions/template/ngclass-instead-of-class-binding.js';
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
import { deprecatedImportRule } from './definitions/scss/deprecated-import.js';
import { alwaysTrueAssertionRule } from './definitions/test/always-true-assertion.js';
import { tsIgnoreWithoutReasonRule } from './definitions/typescript/ts-ignore-without-reason.js';
import { functionTooManyParamsRule } from './definitions/typescript/function-too-many-params.js';
import { exhaustiveSwitchRule } from './definitions/typescript/exhaustive-switch.js';
import { elseAfterReturnRule } from './definitions/hygiene/else-after-return.js';
import { methodCallInTemplateRule } from './definitions/template/method-call-in-template.js';
import { forWithoutEmptyRule } from './definitions/template/for-without-empty.js';
import { noNgmoduleRule } from './definitions/component/no-ngmodule.js';
import { booleanMissingPrefixRule } from './definitions/naming/boolean-missing-prefix.js';
import { evalUsageRule } from './definitions/security/eval-usage.js';
import { letReassignmentRule } from './definitions/fp/let-reassignment.js';
import { enumInsteadOfConstRule } from './definitions/fp/enum-instead-of-const.js';
import { varInLoopRule } from './definitions/fp/var-in-loop.js';
import { vendorPrefixManualRule } from './definitions/scss/vendor-prefix-manual.js';
import { commentedOutAssertionRule } from './definitions/test/commented-out-assertion.js';
import { giantTestRule } from './definitions/test/giant-test.js';
import { sensitiveDataInLogRule } from './definitions/security/sensitive-data-in-log.js';
import { classTooManyMethodsRule } from './definitions/arch/class-too-many-methods.js';
import { classTooManyFieldsRule } from './definitions/arch/class-too-many-fields.js';
import { deprecatedViewchildDecoratorRule } from './definitions/component/deprecated-viewchild-decorator.js';
import { missingPathmatchFullRule } from './definitions/routing/missing-pathmatch-full.js';
import { wildcardNotLastRule } from './definitions/routing/wildcard-not-last.js';
import { missingIconAccessibilityRule } from './definitions/ionic/missing-icon-accessibility.js';
import { poorTestNamingRule } from './definitions/test/poor-test-naming.js';
import { threadSleepInTestRule } from './definitions/test/thread-sleep-in-test.js';
import { imperativeLoopRule } from './definitions/fp/imperative-loop.js';
import { redundantLambdaRule } from './definitions/fp/redundant-lambda.js';
import { nondeterministicInPureRule } from './definitions/fp/nondeterministic-in-pure.js';
import { localstorageUsageRule } from './definitions/ionic/localstorage-usage.js';
import { cordovaPluginUsageRule } from './definitions/ionic/cordova-plugin-usage.js';
import { animateNonCompositableRule } from './definitions/perf/animate-non-compositable.js';
import { noExtendClassRule } from './definitions/scss/no-extend-class.js';
import { assertInCatchOnlyRule } from './definitions/test/assert-in-catch-only.js';
import { highEntropyStringRule } from './definitions/security/high-entropy-string.js';
import { technicalNamingRule } from './definitions/domain/technical-naming.js';
import { frameworkInDomainRule } from './definitions/arch/framework-in-domain.js';
import { deepInheritanceChainRule } from './definitions/arch/deep-inheritance-chain.js';
import { standaloneExplicitRule } from './definitions/component/standalone-explicit.js';
import { eventListenerWithoutDisposeRule } from './definitions/perf/event-listener-without-dispose.js';
import { classFileNameMismatchRule } from './definitions/naming/class-file-name-mismatch.js';
import { genericNameInContextRule } from './definitions/naming/generic-name-in-context.js';
import { similarBlockRule } from './definitions/duplication/similar-block.js';
import { directDomManipulationRule } from './definitions/security/direct-dom-manipulation.js';
import { hardcodedSecretRule } from './definitions/security/hardcoded-secret.js';
import { mutableStateInComputedRule } from './definitions/state/mutable-state-in-computed.js';
import { hardcodedTextRule } from './definitions/template/hardcoded-text.js';
import { dataClumpsRule } from './definitions/domain/data-clumps.js';
import { middleManRule } from './definitions/domain/middle-man.js';
import { temporaryFieldRule } from './definitions/domain/temporary-field.js';
import { noCrossSliceImportRule } from './definitions/arch/no-cross-slice-import.js';
import { mixedConcernsInDirectoryRule } from './definitions/arch/mixed-concerns-in-directory.js';
import { wrongLifecycleRule } from './definitions/ionic/wrong-lifecycle.js';
import { missingIonBackButtonRule } from './definitions/ionic/missing-ion-back-button.js';
import { missingLoadingControllerRule } from './definitions/ionic/missing-loading-controller.js';
import { missingRefresherRule } from './definitions/ionic/missing-refresher.js';
import { preferIonGridRule } from './definitions/ionic/prefer-ion-grid.js';
import { enforcePathAliasRule } from './definitions/imports/enforce-path-alias.js';
import { noCircularTypeImportRule } from './definitions/imports/no-circular-type-import.js';
import { contextMismatchRule } from './definitions/naming/context-mismatch.js';
import { fileClassMismatchRule } from './definitions/naming/file-class-mismatch.js';
import { missingBreakpointsRule } from './definitions/responsive/missing-breakpoints.js';
import { touchTargetTooSmallRule } from './definitions/responsive/touch-target-too-small.js';
import { noObjectMutationRule } from './definitions/fp/no-object-mutation.js';
import { preferReadonlyPropertyRule } from './definitions/fp/prefer-readonly-property.js';
import { preferReadonlyParameterRule } from './definitions/fp/prefer-readonly-parameter.js';
import { preferFrameworkSolutionRule } from './definitions/duplication/prefer-framework-solution.js';
import { structuralCloneRule } from './definitions/duplication/structural-clone.js';
import { duplicateTypeShapeRule } from './definitions/duplication/duplicate-type-shape.js';
import { similarScssBlockRule } from './definitions/duplication/similar-scss-block.js';
import { preferExistingUtilityRule } from './definitions/duplication/prefer-existing-utility.js';

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
  fileNamingConventionRule,
  missingTypeSuffixRule,
  indexBarrelOnlyRule,
  interfacePrefixRule,
  hungarianNotationRule,
  underscorePrefixNonPrivateRule,
  abbreviationInIdentifierRule,
  nonDescriptiveIdentifierRule,
  reservedWordCollisionRule,
  specFileMissingRule,
  inconsistentObservableSuffixRule,
  cssClassNotBemRule,
  scssVariableNotKebabRule,
  cssCustomPropertyNoNamespaceRule,
  missingStyleFileRule,
  filesNotColocatedRule,
  multipleComponentsPerFileRule,
  missingEncapsulationStrategyRule,
  selectorPrefixMismatchRule,
  buttonMissingTypeRule,
  imgMissingDimensionsRule,
  deeplyNestedConditionalsRule,
  missingNgSrcRule,
  duplicateAttributeRule,
  eventWithoutKeyboardRule,
  ionicGridWithoutResponsiveSizesRule,
  magicNumberInScssRule,
  fixedWidthContainerRule,
  hardcodedPxFontRule,
  noOverflowHandlingRule,
  imageWithoutMaxWidthRule,
  fixedHeightContentRule,
  fontDisplayMissingRule,
  duplicateCssClassRule,
  noRelativeParentBeyondTwoRule,
  enforceBarrelImportRule,
  sortedImportsRule,
  nestedSubscribeRule,
  subscribeInConstructorRule,
  topromiseDeprecatedRule,
  missingErrorHandlerRule,
  observableInTemplateCallRule,
  signalReadAfterAwaitRule,
  missingAsReadonlyRule,
  computedSideEffectRule,
  effectWithoutCleanupRule,
  emptySpecRule,
  noFocusedTestRule,
  tooManyAssertionsRule,
  noAssertionRule,
  emptyCatchRule,
  catchOnlyConsoleRule,
  swallowedPromiseRule,
  genericErrorMessageRule,
  consoleLogInProductionRule,
  commentedOutCodeRule,
  todoWithoutTicketRule,
  debuggerStatementRule,
  unusedImportRule,
  deadCodeAfterReturnRule,
  deprecatedInputDecoratorRule,
  deprecatedOutputDecoratorRule,
  constructorInjectionRule,
  deprecatedHostDecoratorRule,
  deprecatedStructuralDirectiveRule,
  forMissingTrackRule,
  ngclassInsteadOfClassBindingRule,
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
  deprecatedImportRule,
  alwaysTrueAssertionRule,
  tsIgnoreWithoutReasonRule,
  functionTooManyParamsRule,
  exhaustiveSwitchRule,
  elseAfterReturnRule,
  methodCallInTemplateRule,
  forWithoutEmptyRule,
  noNgmoduleRule,
  booleanMissingPrefixRule,
  evalUsageRule,
  letReassignmentRule,
  enumInsteadOfConstRule,
  varInLoopRule,
  vendorPrefixManualRule,
  commentedOutAssertionRule,
  giantTestRule,
  sensitiveDataInLogRule,
  classTooManyMethodsRule,
  classTooManyFieldsRule,
  deprecatedViewchildDecoratorRule,
  missingPathmatchFullRule,
  wildcardNotLastRule,
  missingIconAccessibilityRule,
  poorTestNamingRule,
  threadSleepInTestRule,
  imperativeLoopRule,
  redundantLambdaRule,
  nondeterministicInPureRule,
  localstorageUsageRule,
  cordovaPluginUsageRule,
  animateNonCompositableRule,
  noExtendClassRule,
  assertInCatchOnlyRule,
  highEntropyStringRule,
  technicalNamingRule,
  frameworkInDomainRule,
  deepInheritanceChainRule,
  standaloneExplicitRule,
  eventListenerWithoutDisposeRule,
  classFileNameMismatchRule,
  genericNameInContextRule,
  similarBlockRule,
  directDomManipulationRule,
  hardcodedSecretRule,
  mutableStateInComputedRule,
  hardcodedTextRule,
  dataClumpsRule,
  middleManRule,
  temporaryFieldRule,
  noCrossSliceImportRule,
  mixedConcernsInDirectoryRule,
  wrongLifecycleRule,
  missingIonBackButtonRule,
  missingLoadingControllerRule,
  missingRefresherRule,
  preferIonGridRule,
  enforcePathAliasRule,
  noCircularTypeImportRule,
  contextMismatchRule,
  fileClassMismatchRule,
  missingBreakpointsRule,
  touchTargetTooSmallRule,
  noObjectMutationRule,
  preferReadonlyPropertyRule,
  preferReadonlyParameterRule,
  preferFrameworkSolutionRule,
  structuralCloneRule,
  duplicateTypeShapeRule,
  similarScssBlockRule,
  preferExistingUtilityRule,
];
