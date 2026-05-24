export class RegexPatternsService {
  readonly ruleId = 'domain/speculative-generality';
  readonly anotherRule = 'security/high-entropy-string';
  readonly longSlash = 'imports/no-relative-parent-beyond-two';

  private readonly pattern = new RegExp('(?<!\\\\])\\\\.(push|pop|shift|unshift|splice|sort|reverse|fill)\\\\s*\\\\(', 'g');

  validate(input: string): boolean {
    const DEEP_PATH_RE = /^@[a-zA-Z]+\/[a-zA-Z-]+\/[a-zA-Z-]+\/.+\.[a-zA-Z]+$/;
    return DEEP_PATH_RE.test(input);
  }
}
