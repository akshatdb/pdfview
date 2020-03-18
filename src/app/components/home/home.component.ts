import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private http: HttpClient, private renderer: Renderer2) { }
  ckeditorContent = "hello world";
  config = {
    extraPlugins: 'powrcomments',
  };
  comments = [];
  name = 'Akshat Dubey';

  ngOnInit() {
    // this.http.get('http://localhost:8080/').subscribe(res => {
    //   this.ckeditorContent = res['html'];
    // })
  }


}
