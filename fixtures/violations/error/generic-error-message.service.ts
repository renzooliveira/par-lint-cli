export class GenericErrorService {
  validate(input: string) {
    if (!input) throw new Error('Error');
    if (input.length > 100) throw new Error('Something went wrong');
    if (input === 'bad') throw new Error('Failed');
  }
}
