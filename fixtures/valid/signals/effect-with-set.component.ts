import { Component, signal, computed, effect } from '@angular/core';

@Component({ selector: 'app-test', template: '' })
export class EffectWithSetComponent {
  count = signal(0);
  label = signal('');

  derived = computed(() => this.count() * 2);

  constructor() {
    effect(() => {
      const val = this.count();
      this.label.set(`Count: ${val}`);
      console.log('effect ran');
    });
  }

  normalMethod(): void {
    this.label.update(v => v + '!');
  }
}
