import { Component, signal, effect } from '@angular/core';

@Component({ selector: 'app-test', template: '' })
export class SignalAfterAwaitComponent {
  count = signal(0);

  constructor() {
    effect(async () => {
      await fetch('/api/data');
      const val = this.count();
      console.log(val);
    });
  }
}
