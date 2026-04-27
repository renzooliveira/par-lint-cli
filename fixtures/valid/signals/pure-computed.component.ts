import { Component, signal, computed } from '@angular/core';

@Component({ selector: 'app-test', template: '' })
export class PureComputedComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);
}
