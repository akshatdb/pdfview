import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

declare var pdfjsLib: any;

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
  page = 1;
  name = 'Akshat Dubey';
  ngOnInit() {
    // this.http.get('http://localhost:8080/').subscribe(res => {
    //   this.ckeditorContent = res['html'];
    // })
    this.http.get(environment.base + '/annotations?id=1').subscribe((res: Array<any>) => {
      this.comments = res[0] ? res[0].comments : [];
    }, err => {
      this.comments = [];
    })
  }

  save(evt) {
    // this.comments = evt;
    this.http.post(environment.base + '/annotations?id=1', { comments: evt, id: '1' }).subscribe(res => {
      console.log('saved');
    });
  }

  delete() {
    this.http.delete(environment.base + '/annotations?id=1').subscribe(res => {
      console.log('deleted');
    })
  }
}
