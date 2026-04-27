export class ProcessService {
  process() {
    const x = 10;
    const d = new Date();
    const temp = 'temporary';
    const val = 42;
    const obj = {};
    const data = [];
    const res = fetch('/api');
    if (x > 5) {
      return val;
    }
    return temp;
  }

  // i/j/k in for-loop are fine
  iterate(items: number[]) {
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < 10; j++) {
        console.log(items[i], j);
      }
    }
  }
}
