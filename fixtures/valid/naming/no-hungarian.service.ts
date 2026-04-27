export class DataService {
  name = 'hello';
  count = 42;
  isActive = true;
  items = [1, 2, 3];
  config = {};
  age = 25;
  callback = () => {};

  process(input: string) {
    const result = parseInt(input);
    return result;
  }
}
