import { Component } from '@angular/core';

@Component({
  selector: 'app-bad',
  templateUrl: './bad.component.html',
})
export class BadComponent {
  items: any[] = [];

  ngOnInit() {
    this.someObservable$.subscribe(data => {
      this.items = data;
    });
  }
}
