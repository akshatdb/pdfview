import { Component, OnInit } from '@angular/core';
import { slideInAnimation } from './animations/nav.animation';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    slideInAnimation
  ]
})
export class AppComponent implements OnInit {
  title = 'rumdemo';
  navstate = false;
  constructor() { }
  animateRoute(outlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['title'];
  }
  ngOnInit() {
  }
}
