import { Component, signal, computed } from '@angular/core';

@Component({ selector: 'app-test', template: '' })
export class ComputedSideEffectComponent {
  count = signal(0);
  double = computed(() => {
    this.count.set(10);
    console.log('computing');
    return this.count() * 2;
  });
}
