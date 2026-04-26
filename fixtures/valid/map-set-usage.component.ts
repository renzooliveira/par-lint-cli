import { Component } from '@angular/core';

@Component({ selector: 'app-map-demo', template: '' })
export class MapDemoComponent {
  private groups = new Map<string, string[]>();
  private items = new Set<string>();
  private counts = new Map<string, number>();

  doStuff() {
    // These should NOT be flagged: Map.set and Set.add are not signals
    this.groups.set('key', ['value']);
    this.items.add('item');
    this.counts.set('total', 42);

    const urlParams = new URLSearchParams();
    urlParams.set('page', '1');

    const formData = new FormData();
    formData.set('name', 'value');
  }
}
