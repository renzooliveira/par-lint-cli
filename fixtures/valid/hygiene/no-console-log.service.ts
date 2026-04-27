export class NoConsoleLogService {
  loadData() {
    console.warn('deprecation notice');
    console.error('critical failure');
  }
}
