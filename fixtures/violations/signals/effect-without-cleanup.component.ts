import { Component, signal, effect } from '@angular/core';

@Component({ selector: 'app-test', template: '' })
export class EffectNoCleanupComponent {
  count = signal(0);

  constructor() {
    effect(() => {
      const handler = () => console.log(this.count());
      document.addEventListener('click', handler);
      setTimeout(() => console.log('delayed'), 1000);
    });
  }
}
