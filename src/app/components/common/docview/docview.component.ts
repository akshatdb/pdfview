import { Component, OnChanges, OnInit, Renderer2, ElementRef, ViewChild, Inject, HostBinding, Input, Output, EventEmitter, Host } from "@angular/core";
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
    hideComments = false;
    pdf;
    current;
    @ViewChild('commentLayer', { static: true }) commentsLayer: ElementRef;
    @ViewChild('containerLayer', { static: true }) containerLayer: ElementRef;
    @ViewChild('eventLayer', { static: true }) eventLayer: ElementRef;
    @ViewChild('pdfcanvas', { static: true }) canvasEl: ElementRef;
    @ViewChild('pdfcontainer', { static: true }) container: ElementRef;
    @ViewChild('topBar', { static: true }) topbar: ElementRef;
    @Input() comments = [];
    @Input() user = {};
    @Input() domainKey = 'domainId';
    @Input() nameKey = 'name';
    @Input() highlightColor = '#dc93932e';
    @Input() url;
    @Input() fullMode = false;
    @Input() showCommentsAlways = true;
    @Input() draggableComment = false;
    @Output() commentsChange: EventEmitter<any> = new EventEmitter();
    @Output() newComment: EventEmitter<any> = new EventEmitter();
    @Output() updateComment: EventEmitter<any> = new EventEmitter();
    @Output() deleteComments: EventEmitter<any> = new EventEmitter();
    @Output() deleteSingle: EventEmitter<any> = new EventEmitter();
    @HostBinding('style.width') width;
    @HostBinding('style.height') height;
    @HostBinding('style.top') top;
    @HostBinding('style.left') left;
    @HostBinding('style.position') position = 'relative';
    @HostBinding('style.background') background;
    @HostBinding('style.zindex') zindex;

    setHeight = '600px';
    stylebackUp: {
        height: string,
        width: string,
        top: string,
        left: string,
        position: string,
        background: string,
        zindex: string,
    };


    ngOnChanges(changes) {
        if (this.url && !this.loading && changes.url) {
            this.page = 1;
            this.noOfPages = 1;
            this.pdf = null;
            this.renderPdf();
        }
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
            if (res) {
                if (res.delete) {
                    this.comments = this.comments.filter(row => !row._id || row._id !== res.delete);
                    this.deleteSingle.emit({ _id: res.delete })
                }
                if (res.deleteLocal) {
                    this.comments = this.comments.filter(row => !row.localid || row.localid !== res.deleteLocal);
                    this.commentsChange.emit(this.comments);
                }
            }
        });
    }

    toggleFullscreen() {
        if (this.fullMode) {
            this.fullMode = false;
            this.height = this.stylebackUp.height;
            this.width = this.stylebackUp.width;
            this.position = this.stylebackUp.position;
            this.top = this.stylebackUp.top;
            this.left = this.stylebackUp.left;
            this.background = this.stylebackUp.background;
            this.zindex = this.stylebackUp.zindex;
        }
        else {
            this.stylebackUp = {
                height: this.height,
                width: this.width,
                position: this.position,
                top: this.top,
                left: this.left,
                background: this.background,
                zindex: this.zindex,
            }
            this.fullMode = true;
            this.height = '100%';
            this.width = '100%';
            this.position = 'fixed';
            this.top = '0';
            this.left = '0';
            this.background = 'white';
            this.zindex = '10000';
        }
        this.loading = false
        this.renderPdf();
    }
    saveComment(evt, comment) {
        let newComment = {
            x: evt.x,
            y: evt.y,
            height: evt.height,
            width: evt.width,
            iconx: this.getNumFromPixel(evt.x) + this.getNumFromPixel(evt.width) + '%',
            icony: this.getNumFromPixel(evt.y) + this.getNumFromPixel(evt.height) + '%',
            page: this.page,
            comment: comment,
            user: this.user,
            time: Date.now()
        };
        this.comments = [...this.comments, newComment];
        this.commentsChange.emit(this.comments);
        this.newComment.emit(newComment);
        newComment['localid'] = this.uuidv4();
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // intersectionOverUnion(comment, newComment){
    //     const w_intersection = Math.min(comment.x + comment.width, newComment.x + newComment.width) - Math.max(comment.x, newComment.x);
    //     const h_intersection = Math.min(comment.xy + comment.height, newComment.y + newComment.height) - Math.max(comment.y, newComment.y);
    //     if (w_intersection <= 0 || h_intersection <= 0)
    //         return 0
    //     const I = w_intersection * h_intersection;
    //     const U = comment.height * comment.width + newComment.height * newComment.width - I; 
    //     return I/U;
    // }

    deleteAll() {
        this.deleteComments.emit(true);
    }

    posChange(comment, event) {
        comment.iconx = event.left;
        comment.icony = event.top;
        this.updateComment.emit(comment);
        this.commentsChange.emit(this.comments);
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

    loadPdf() {
        return new Promise((resolve, reject) => {
            if (this.pdf)
                resolve(this.pdf);
            else {
                pdfjsLib.getDocument(this.url)
                    .then((pdf) => {
                        this.pdf = pdf;
                        this.noOfPages = pdf.numPages;
                        resolve(pdf);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    renderPdf() {
        if (!this.loading) {
            this.loading = true;
            this.loadPdf()
                .then((pdf: any) => {
                    return pdf.getPage(this.page);
                })
                .then((page) => {

                    let viewport = page.getViewport(1.0);
                    let scale = 1;
                    // const padding = 2 * this.getNumFromPixel(window.getComputedStyle(this.el.nativeElement.parentElement, null).getPropertyValue('padding-left'));
                    scale = (this.containerLayer.nativeElement.clientWidth - 18) / viewport.width;
                    viewport = page.getViewport(scale);
                    let context = this.canvasEl.nativeElement.getContext('2d');
                    this.canvasEl.nativeElement.height = viewport.height;
                    this.canvasEl.nativeElement.width = viewport.width;
                    // this.topbar.nativeElement.style.width = this.containerLayer.nativeElement.clientWidth + 'px';
                    if (this.fullMode)
                        this.containerLayer.nativeElement.style.height = '100%';
                    else
                        this.containerLayer.nativeElement.style.height = this.setHeight ? this.setHeight : window.innerHeight - this.containerLayer.nativeElement.getBoundingClientRect().top + 'px';

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
                if (!this.currDiv) {
                    this.currDiv = this.renderer.createElement('div');
                    this.renderer.addClass(this.currDiv, 'comment-container');
                    this.currDiv.style.position = 'absolute';
                    this.currDiv.style.left = pointer.x + 'px';
                    this.currDiv.style.top = pointer.y + 'px';
                    this.currDiv.style.background = '#8080803d';
                    this.fixedFromLeft = true;
                    this.renderer.appendChild(this.commentsLayer.nativeElement, this.currDiv);
                }
                else {
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
            case 'touchstart': type = 'start'; break;
            case 'touchmove': type = 'move'; break;
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
            case 'mousemove': type = 'move'; break;
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
    comment: any;
    user;
    domainKey = 'domainId';
    nameKey = 'name';
    ngOnInit() {
        this.mode = this.data.mode;
        this.comment = this.data.mode === 'view' ? this.data.comment : {};
        this.user = this.data.user;
        this.domainKey = this.data.domainKey ? this.data.domainKey : this.domainKey;
        this.nameKey = this.data.nameKey ? this.data.nameKey : this.nameKey;
    }
    deleteSingle(comment) {
        if (comment._id) {
            this.dialogRef.close({
                delete: comment._id
            })
        }
        else {
            this.dialogRef.close({
                deleteLocal: comment.localid
            })
        }
    }
    cancel(): void {
        this.dialogRef.close();
    }
    save(): void {
        this.dialogRef.close(this.commentStr)
    }

}
