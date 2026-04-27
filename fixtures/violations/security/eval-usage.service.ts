export class DynamicService {
  execute(code: string) {
    return eval(code);
  }

  createFunction(body: string) {
    return new Function('x', body);
  }
}
