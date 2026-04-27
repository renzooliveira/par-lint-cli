export class SpecificErrorService {
  validate(input: string) {
    if (!input) throw new Error('Validation failed: input is required');
    if (input.length > 100) throw new Error('Input exceeds maximum length of 100 characters');
  }
}
