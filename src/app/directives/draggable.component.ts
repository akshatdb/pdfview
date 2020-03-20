import { OnInit, Directive, HostListener, ElementRef, EventEmitter, Output } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import { map, takeUntil, flatMap, switchMap, tap } from 'rxjs/operators';

@Directive({
    selector: '[draggable]'
})
export class Draggable implements OnInit {

    mouseup = new EventEmitter<MouseEvent>();
    mousedown = new EventEmitter<MouseEvent>();
    mousemove = new EventEmitter<MouseEvent>();
    @Output()
    clicked = new EventEmitter<MouseEvent>();
    @Output()
    positionChange = new EventEmitter<any>();

    mousedrag: Observable<{ top, left }>;


    flagX;
    flagY;
    @HostListener('document:mouseup', ['$event'])
    onMouseup(event: MouseEvent) {
        if (event.target['parentElement'] === this.element.nativeElement && event.screenX === this.flagX && event.screenY === this.flagY) {
            this.clicked.emit(event);
            return false;
        }
        this.mouseup.emit(event);
        this.flagX = undefined;
        this.flagY = undefined;
    }

    @HostListener('mousedown', ['$event'])
    onMousedown(event: MouseEvent) {
        this.mousedown.emit(event);
        this.flagX = event.screenX;
        this.flagY = event.screenY;
        return false; // Call preventDefault() on the event
    }

    @HostListener('document:mousemove', ['$event'])
    onMousemove(event: MouseEvent) {
        this.mousemove.emit(event);
    }

    constructor(public element: ElementRef) {
        this.element.nativeElement.style.position = 'absolute';
        this.element.nativeElement.style.cursor = 'pointer';

        this.mousedrag = this.mousedown.pipe(map(event => {
            return {
                top: event.clientY - this.element.nativeElement.parentElement.getBoundingClientRect().top,
                left: event.clientX - this.element.nativeElement.parentElement.getBoundingClientRect().left
            };
        }),
            switchMap(
                imageOffset => this.mousemove.pipe(map(pos => {
                    let obj = {
                        top: 0,
                        left: 0
                    }
                    obj.top = pos.clientY - this.element.nativeElement.parentElement.getBoundingClientRect().top;
                    obj.left = pos.clientX - this.element.nativeElement.parentElement.getBoundingClientRect().left;
                    if (obj.top <= 0) {
                        obj.top = 0;
                    }
                    if (obj.top >= this.element.nativeElement.parentElement.getBoundingClientRect().height - 20) {
                        obj.top = this.element.nativeElement.parentElement.getBoundingClientRect().height - 20;
                    }
                    if (obj.left <= 0) {
                        obj.left = 0;
                    }
                    if (obj.left >= this.element.nativeElement.parentElement.getBoundingClientRect().width - 20) {
                        obj.left = this.element.nativeElement.parentElement.getBoundingClientRect().width - 20;
                    }
                    return obj
                }),
                    takeUntil(this.mouseup.pipe(
                        tap((evt) => {
                            this.positionChange.emit({
                                top: this.getNumFromPixel(this.element.nativeElement.style.top) / this.element.nativeElement.parentElement.getBoundingClientRect().height * 100 + '%',
                                left: this.getNumFromPixel(this.element.nativeElement.style.left) / this.element.nativeElement.parentElement.getBoundingClientRect().width * 100 + '%'
                            })
                        })
                    )),
                    takeUntil(this.clicked)
                )));
    }

    ngOnInit() {
        this.mousedrag.subscribe({
            next: pos => {
                this.element.nativeElement.style.top = pos.top + 'px';
                this.element.nativeElement.style.left = pos.left + 'px';
            }
        });
    }
    getNumFromPixel(val: string): number {
        let l = val.length;
        if (!isNaN(Number(val.substring(0, l - 2))))
            return Number(val.substring(0, l - 2));
        else
            return -1;
    }
}