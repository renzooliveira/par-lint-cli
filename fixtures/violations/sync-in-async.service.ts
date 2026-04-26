export class BadAsyncService {
  async fetchData() {
    const promise = fetch('/api/data');
    const result = promise.Result;
    return result;
  }

  async processItem() {
    const task = this.longRunning();
    task.Wait();
  }

  private longRunning(): any {
    return Promise.resolve();
  }
}
