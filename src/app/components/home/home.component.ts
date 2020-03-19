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
  comments = [];
  page = 1;
  name = 'Akshat Dubey';
  url: any = 'assets/sample.pdf';
  id = '1';
  file: File;
  ngOnInit() {
    this.getComments();
  }

  getComments() {
    this.http.get(environment.base + `/annotations?id=${this.id}`).subscribe((res: Array<any>) => {
      this.comments = res[0] ? res[0].comments : [];
    }, err => {
      this.comments = [];
    });
  }

  save(evt) {
    // this.comments = evt;
    this.http.post(environment.base + `/annotations?id=${this.id}`, { comments: evt, id: this.id }).subscribe(res => {
      console.log('saved');
    });
  }


  fileHandle(evt) {
    this.file = evt.target.files[0];
    this.id = null;
  }
  loadFile() {
    if (this.file && this.id) {
      this.getComments();
      let fileReader = new FileReader();

      fileReader.onload = (res: any) => {
        let typedarray = new Uint8Array(<ArrayBuffer>fileReader.result);
        this.url = typedarray;
        typedarray = new Uint8Array(<ArrayBuffer>fileReader.result);
        this.url = typedarray;
      };
      fileReader.readAsArrayBuffer(this.file);
    }
  }

  delete() {
    this.http.delete(environment.base + `/annotations?id=${this.id}`).subscribe(res => {
      console.log('deleted');
      this.comments = [];
    })
  }

  // uuidv4() {
  //   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
  //     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  //     return v.toString(16);
  //   });
  // }
}
