export class LoopService {
  process(items: string[]) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      console.log(item);
    }
  }
}
