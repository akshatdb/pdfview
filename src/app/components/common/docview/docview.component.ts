import { Component, OnChanges, OnInit, Renderer2, ElementRef, ViewChild, Inject, HostBinding, Input, Output, EventEmitter } from "@angular/core";
import { fromEvent } from 'rxjs';
import { map, switchMap, takeUntil, pairwise, tap } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
declare var pdfjsLib: any;


@Component({
    selector: 'app-docview',
    templateUrl: './docview.component.html',
    styleUrls: ['./docview.component.scss']
})
export class DocviewComponent implements OnChanges, OnInit {
    constructor(private el: ElementRef, private renderer: Renderer2, private md: MatDialog) { }
    currDiv: any;
    fixedFromLeft;
    fixedFromTop;
    commentShow = false;
    commentMode = false;
    page = 1;
    noOfPages = 1;
    loading = false;
    @ViewChild('commentLayer', { static: true }) commentsLayer: ElementRef;
    @ViewChild('containerLayer', { static: true }) containerLayer: ElementRef;
    @ViewChild('eventLayer', { static: true }) eventLayer: ElementRef;
    @ViewChild('pdfcanvas', { static: true }) canvasEl: ElementRef;
    @ViewChild('pdfcontainer', { static: true }) container: ElementRef;
    @Input() comments = [];
    @Input() user = {};
    @Input() domainKey = 'domainId';
    @Input() nameKey = 'name';
    @Input() highlightColor = '#dc93932e';
    @Input() url;
    @Output() commentsChange: EventEmitter<any> = new EventEmitter();
    @Output() deleteComments: EventEmitter<any> = new EventEmitter();

    ngOnChanges() {
        this.page = 1;
        this.noOfPages = 1;
        this.loading = false;
        if (this.url)
            this.renderPdf();
        console.log(this.comments);
    }

    ngOnInit() {
        this.captureEvents(this.eventLayer.nativeElement);
    }

    toggleCommentMode() {
        this.commentMode = !this.commentMode;
    }

    addComment(evt) {
        let commentDialog = this.md.open(CommentDialog, {
            panelClass: 'comment-dialog',
            data: {
                mode: 'add'
            }
        });
        commentDialog.afterClosed().subscribe(res => {
            if (res && res.length > 0) {
                this.saveComment(evt, res);
            }
            this.commentMode = false;
            this.renderer.removeChild(this.commentsLayer.nativeElement, this.currDiv);
        })
    }

    viewComment(comment) {
        let commentDialog = this.md.open(CommentDialog, {
            panelClass: 'comment-view-dialog',
            data: {
                mode: 'view',
                comment: comment,
                user: this.user[this.domainKey],
                domainKey: this.domainKey,
                nameKey: this.nameKey
            }
        });
        commentDialog.afterClosed().subscribe(res => {
            if (res && res.length > 0) {
                console.log('reply');
            };
        });
    }
    saveComment(evt, comment) {
        this.comments = [...this.comments, {
            x: evt.x,
            y: evt.y,
            height: evt.height,
            width: evt.width,
            page: this.page,
            comment: [{
                comment: comment,
                user: this.user,
                time: Date.now()
            }]
        }];
        this.commentsChange.emit(this.comments);
    }

    deleteAll() {
        this.deleteComments.emit(true);
    }

    // PDF Rendering functions
    nextPage() {
        this.page++;
        let context = this.canvasEl.nativeElement.getContext('2d');
        context.clearRect(0, 0, this.canvasEl.nativeElement.width, this.canvasEl.nativeElement.height);
        this.renderPdf();
    }
    prevPage() {
        this.page--;
        let context = this.canvasEl.nativeElement.getContext('2d');
        context.clearRect(0, 0, this.canvasEl.nativeElement.width, this.canvasEl.nativeElement.height);
        this.renderPdf();
    }
    renderPdf() {
        if (!this.loading) {
            this.loading = true;
            pdfjsLib.getDocument(this.url)
                .then((pdf) => {
                    this.noOfPages = pdf.numPages;
                    return pdf.getPage(this.page);
                })
                .then((page) => {

                    let viewport = page.getViewport(1.0);
                    let scale = this.container.nativeElement.clientHeight / viewport.height;
                    viewport = page.getViewport(scale);


                    let context = this.canvasEl.nativeElement.getContext('2d');

                    this.canvasEl.nativeElement.height = viewport.height;
                    this.canvasEl.nativeElement.width = viewport.width;

                    let renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    let pageRendering = page.render(renderContext);
                    let completeCallback = pageRendering._internalRenderTask.callback;
                    let that = this;
                    pageRendering._internalRenderTask.callback = function (error) {
                        completeCallback.call(this, error);
                        that.loading = false;
                    };
                });
        }
    }
    private captureEvents(el: HTMLElement) {
        // this will capture all mousedown events from the canvas element
        fromEvent(el, 'mousedown')
            .pipe(
                tap((evt) => {
                    this.dispatchMouse(el, evt);
                }),
                switchMap((e) => {
                    // after a mouse down, we'll record all mouse moves
                    return fromEvent(el, 'mousemove')
                        .pipe(
                            // we'll stop (and unsubscribe) once the user releases the mouse
                            // this will trigger a 'mouseup' event    
                            takeUntil(fromEvent(el, 'mouseup').pipe(tap(evt => {
                                this.dispatchMouse(el, evt);
                            }))),
                            // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
                            // takeUntil(fromEvent(el, 'mouseleave').pipe(tap(evt => this.dispatchMouse(el, evt)))),
                        )
                })
            )
            .subscribe((evt: MouseEvent) => {
                this.dispatchMouse(el, evt);
            });
        fromEvent(el, 'touchstart')
            .pipe(
                tap((evt) => {
                    this.dispatchTouch(el, evt);
                }),
                switchMap((e) => {
                    return fromEvent(el, 'touchmove')
                        .pipe(
                            takeUntil(fromEvent(el, 'touchend').pipe(tap(evt => {
                                this.dispatchTouch(el, evt);
                            }))),
                        )
                })
            )
            .subscribe((evt: TouchEvent) => {
                this.dispatchTouch(el, evt);
            })
    }

    handlePointer(pointer) {
        switch (pointer.type) {
            case 'start':
                this.currDiv = this.renderer.createElement('div');
                this.renderer.addClass(this.currDiv, 'comment-container');
                this.currDiv.style.position = 'absolute';
                this.currDiv.style.left = pointer.x + 'px';
                this.currDiv.style.top = pointer.y + 'px';
                this.currDiv.style.background = '#8080803d';
                this.fixedFromLeft = true;
                this.renderer.appendChild(this.commentsLayer.nativeElement, this.currDiv);
                break;
            case 'move':
                // this.currDiv
                if (this.currDiv) {
                    // handling x axis - 
                    if (this.fixedFromLeft && pointer.x < this.getNumFromPixel(this.currDiv.style.left)) {
                        this.fixedFromLeft = false;
                        this.currDiv.style.right = this.currDiv.style.left;
                        this.currDiv.style.left = undefined;
                        this.currDiv.style.width = ((this.getNumFromPixel(this.currDiv.style.right) - pointer.x) / this.commentsLayer.nativeElement.offsetWidth * 100) + '%';
                    }
                    else {
                        this.fixedFromLeft = true;
                        this.currDiv.style.width = ((pointer.x - this.getNumFromPixel(this.currDiv.style.left)) / this.commentsLayer.nativeElement.offsetWidth * 100) + '%';
                    }
                    //handling y axis -
                    if (this.fixedFromTop && pointer.y < this.getNumFromPixel(this.currDiv.style.top)) {
                        this.fixedFromTop = false;
                        this.currDiv.style.bottom = this.currDiv.style.top;
                        this.currDiv.style.top = undefined;
                        this.currDiv.style.height = ((this.getNumFromPixel(this.currDiv.style.bottom) - pointer.y) / this.commentsLayer.nativeElement.offsetHeight * 100) + '%';
                    }
                    else {
                        this.fixedFromTop = true;
                        this.currDiv.style.height = ((pointer.y - this.getNumFromPixel(this.currDiv.style.top)) / this.commentsLayer.nativeElement.offsetHeight * 100) + '%';
                    }
                }
                break;
            case 'end':
                this.currDiv.style.background = undefined;
                this.currDiv.style.left = (this.getNumFromPixel(this.currDiv.style.left) / this.commentsLayer.nativeElement.offsetWidth * 100) + '%';
                this.currDiv.style.top = (this.getNumFromPixel(this.currDiv.style.top) / this.commentsLayer.nativeElement.offsetHeight * 100) + '%';
                this.addComment({
                    x: this.currDiv.style.left,
                    y: this.currDiv.style.top,
                    width: this.currDiv.style.width,
                    height: this.currDiv.style.height
                });
                break;
        }
    }

    getNumFromPixel(val: string): number {
        let l = val.length;
        if (!isNaN(Number(val.substring(0, l - 2))))
            return Number(val.substring(0, l - 2));
        else
            return -1;
    }

    dispatchTouch(el, evt) {
        let type;
        switch (evt.type) {
            case 'mousemove': type = 'start'; break;
            case 'mousemove': type = 'move'; break;
            case 'touchend': type = 'end'; break;
            default: type = 'move'; break
        }
        const rect = el.getBoundingClientRect();
        const currentPos = {
            x: evt.changedTouches[0].clientX - rect.left,
            y: evt.changedTouches[0].clientY - rect.top,
            type: type
        };
        this.handlePointer(currentPos);
    }

    dispatchMouse(el, evt) {
        let type;
        switch (evt.type) {
            case 'mousedown': type = 'start'; break;
            case 'touchmove': type = 'move'; break;
            case 'mouseup': type = 'end'; break;
            // case 'mouseleave': type = 'end'; break;
            default: type = 'move'; break;
        }
        const rect = el.getBoundingClientRect();
        const currentPos = {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
            type: type
        };

        this.handlePointer(currentPos);
    }
}

@Component({
    selector: 'comment-dialog',
    templateUrl: 'comment-dialog.html',
    styleUrls: ['comment-dialog.scss']
})
export class CommentDialog implements OnInit {

    constructor(
        public dialogRef: MatDialogRef<CommentDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any) { }
    commentStr = '';
    mode = '';
    comments = [];
    user;
    domainKey = 'domainId';
    nameKey = 'name';
    ngOnInit() {
        this.mode = this.data.mode;
        this.comments = this.data.mode === 'view' ? this.data.comment : [];
        this.user = this.data.user;
        this.domainKey = this.data.domainKey ? this.data.domainKey : this.domainKey;
        this.nameKey = this.data.nameKey ? this.data.nameKey : this.nameKey;
    }
    cancel(): void {
        this.dialogRef.close();
    }
    save(): void {
        this.dialogRef.close(this.commentStr)
    }

}
