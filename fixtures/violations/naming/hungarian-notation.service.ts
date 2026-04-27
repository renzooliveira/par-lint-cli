export class DataService {
  strName = 'hello';
  numCount = 42;
  boolActive = true;
  arrItems = [1, 2, 3];
  objConfig = {};
  intAge = 25;
  fnCallback = () => {};

  process(strInput: string) {
    const numResult = parseInt(strInput);
    return numResult;
  }
}
