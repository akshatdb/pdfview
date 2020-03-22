import { OnInit, Directive, HostListener, ElementRef, EventEmitter, Output, Input } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import { map, takeUntil, flatMap, switchMap, tap } from 'rxjs/operators';

@Directive({
    selector: '[draggable]'
})
export class Draggable implements OnInit {

    mouseup = new EventEmitter<MouseEvent | {
        clientX: any,
        clientY: any
    }>();
    mousedown = new EventEmitter<MouseEvent | {
        clientX: any,
        clientY: any
    }>();
    mousemove = new EventEmitter<MouseEvent | {
        clientX: any,
        clientY: any
    }>();
    @Output()
    clicked = new EventEmitter<MouseEvent | {
        clientX: any,
        clientY: any
    }>();
    @Output()
    positionChange = new EventEmitter<any>();
    @Output()
    longpress = new EventEmitter<any>();
    @Input()
    longPressDuration = 1000;

    mousedrag: Observable<{ top, left }>;


    flagX;
    flagY;
    timerState = false;
    timer;
    @HostListener('document:touchend', ['$event'])
    @HostListener('document:mouseup', ['$event'])
    onMouseup(event: MouseEvent | TouchEvent) {
        if (event instanceof MouseEvent) {
            if (event.target['parentElement'] === this.element.nativeElement && event.screenX === this.flagX && event.screenY === this.flagY) {
                if (this.timerState)
                    this.clicked.emit(event);
                clearTimeout(this.timer);
                return false;
            }
            this.mouseup.emit(event);
            this.flagX = undefined;
            this.flagY = undefined;
            this.timerState = false;
        }
        else {
            if (event.target['parentElement'] === this.element.nativeElement) {
                if (event.target['parentElement'] === this.element.nativeElement && event.changedTouches[0].screenX === this.flagX && event.changedTouches[0].screenY === this.flagY) {
                    if (this.timerState) {
                        this.clicked.emit({
                            clientX: event.changedTouches[0].clientX,
                            clientY: event.changedTouches[0].clientY
                        });
                    }
                    clearTimeout(this.timer);
                    return false;
                }
                this.mouseup.emit({
                    clientX: event.changedTouches[0].clientX,
                    clientY: event.changedTouches[0].clientY
                });
                this.flagX = undefined;
                this.flagY = undefined;
                this.timerState = false;

            }
        }
    }
    @HostListener('document:touchstart', ['$event'])
    @HostListener('mousedown', ['$event'])
    onMousedown(event: MouseEvent | TouchEvent) {
        if (event instanceof MouseEvent) {
            this.mousedown.emit(event);
            this.flagX = event.screenX;
            this.flagY = event.screenY;
            this.timerState = true;
            this.timer = setTimeout(() => {
                if (this.timerState) {
                    this.longpress.emit(event);
                    this.timerState = false;
                }
            }, this.longPressDuration);
        }
        else {
            if (event.target['parentElement'] === this.element.nativeElement) {
                this.mousedown.emit({
                    clientX: event.changedTouches[0].clientX,
                    clientY: event.changedTouches[0].clientY
                });
                this.flagX = event.changedTouches[0].screenX;
                this.flagY = event.changedTouches[0].screenY;
                this.timerState = true;
                this.timer = setTimeout(() => {
                    if (this.timerState) {
                        this.longpress.emit(event);
                        this.timerState = false;
                    }
                }, this.longPressDuration);
            }
        }
        // return false; // Call preventDefault() on the event
    }
    @HostListener('document:touchmove', ['$event'])
    @HostListener('document:mousemove', ['$event'])
    onMousemove(event: MouseEvent | TouchEvent) {
        if (event instanceof MouseEvent) {
            this.mousemove.emit(event);
        }
        else {
            if (event.target['parentElement'] === this.element.nativeElement) {
                this.mousemove.emit({
                    clientX: event.changedTouches[0].clientX,
                    clientY: event.changedTouches[0].clientY
                });
            }
        }
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