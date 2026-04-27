import { Component, signal, effect } from '@angular/core';

@Component({ selector: 'app-test', template: '' })
export class EffectWithCleanupComponent {
  count = signal(0);

  constructor() {
    effect((onCleanup) => {
      const handler = () => console.log(this.count());
      document.addEventListener('click', handler);
      onCleanup(() => document.removeEventListener('click', handler));
    });
  }
}
