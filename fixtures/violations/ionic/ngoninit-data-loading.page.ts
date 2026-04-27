import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: '<ion-content><p>Home</p></ion-content>',
})
export class HomePage implements OnInit {
  data: any[] = [];

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    fetch('/api/data').then(r => r.json()).then(d => this.data = d);
  }
}
