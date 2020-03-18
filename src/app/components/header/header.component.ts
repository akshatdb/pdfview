import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { slideInOut } from 'src/app/animations/fadeup.animation';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [slideInOut]
})
export class HeaderComponent implements OnInit {

  @Output()
  opennav:EventEmitter<boolean> = new EventEmitter();
  menuOpen = false;
  openMenu = 'close';
  constructor() { }

  ngOnInit() {
  }
  openNav(){
    this.menuOpen = !this.menuOpen;
    this.opennav.emit(this.menuOpen);
  }

}
