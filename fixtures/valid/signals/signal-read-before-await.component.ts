import { Component, signal, effect } from '@angular/core';

@Component({ selector: 'app-test', template: '' })
export class SignalBeforeAwaitComponent {
  count = signal(0);

  constructor() {
    effect(() => {
      const val = this.count();
      console.log(val);
    });
  }
}
