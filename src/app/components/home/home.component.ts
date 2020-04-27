import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

declare var pdfjsLib: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private http: HttpClient, private renderer: Renderer2, private snackbar: MatSnackBar) { }
  comments = [];
  page = 1;
  name = 'Akshat Dubey';
  url: any = 'assets/sample.pdf';
  id = '1';
  file: File | Blob;
  dragFlag = false;
  ngOnInit() {
    this.getComments();
  }

  getComments() {
    this.http.get(environment.base + `/annotations?docid=${this.id}`).subscribe((res: Array<any>) => {
      this.comments = res ? res : [];
    }, err => {
      this.comments = [];
    });
  }

  save(evt) {
    // this.comments = evt;
    evt['docid'] = this.id;
    this.http.post(environment.base + `/annotations`, evt).subscribe(res => {
      this.getComments();
    });
  }

  update(evt) {
    this.http.put(environment.base + `/annotations?docid=${this.id}&_id=${evt._id}`, evt).subscribe(res => {
      this.getComments();
    })
  }


  fileHandle(evt) {
    const fileSplit = evt.target.files[0].name.split('.');
    switch (fileSplit[fileSplit.length - 1]) {
      case 'docx':
        let form = new FormData();
        form.append('file', evt.target.files[0]);
        this.http.post(environment.docxtopdf + '/docxpdf', form, { responseType: "blob" }).subscribe(res => {
          this.file = res;
        }, err => {
          this.snackbar.open('Error while rendering file');
        })
        break;
      case 'pdf':
        this.file = evt.target.files[0];
        break;
      default:
        console.log('Not supported');
    }
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

  delete(evt?) {
    if (evt && evt._id) {
      this.http.delete(environment.base + `/annotations?docid=${this.id}&_id=${evt._id}`).subscribe(res => {
        console.log('deleted');
        this.getComments();
      });
    }
    else {
      this.http.delete(environment.base + `/annotations/all?docid=${this.id}`).subscribe(res => {
        console.log('deleted');
        this.comments = [];
      });
    }
  }
}
