import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

  @Input() state = false;
  menu = [
    { name: 'Home', icon: 'home', route: '/home' }
  ];
  activeroute = '';

  constructor(private router: Router, private location: Location) { }
  ngOnInit() {
    this.location.onUrlChange(evt => {
      this.activeroute = evt;
    })
  }

  routeTo(route) {
    this.router.navigate([route]);
  }

}
