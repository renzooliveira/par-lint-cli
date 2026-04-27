export class ConsoleLogService {
  loadData() {
    console.log('loading data...');
    console.debug('debug info');
    console.info('info message');
    console.warn('this is fine');
    console.error('this is fine too');
  }
}
