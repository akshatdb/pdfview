import {
  Component, Input, ElementRef, AfterViewInit, ViewChild, HostBinding, Host, Output, EventEmitter
} from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { switchMap, takeUntil, pairwise, multicast, takeLast, take, map, concatMap, tap, last } from 'rxjs/operators';
import { SketchEvent } from './sketchpad.events';

@Component({
  selector: 'app-sketch',
  templateUrl: './sketchpad.component.html',
  styles: ['canvas { border: 1px solid #000; }']
})
export class SketchpadComponent implements AfterViewInit {
  // a reference to the canvas element from our template
  @ViewChild('canvas', { static: true }) public canvas: ElementRef;
  @Output() sketch: EventEmitter<SketchEvent> = new EventEmitter();
  @Output() pointerMove: EventEmitter<any> = new EventEmitter();
  @Output() stroke: EventEmitter<any> = new EventEmitter();
  @Output() resized: EventEmitter<any> = new EventEmitter();

  // setting a width and height for the canvas
  // @Input() public width = 400;
  // @Input() public height = 400;
  @Input() clearEvent: Subject<boolean>;
  @Input() eraseEvent: Subject<{
    prevPos: { x: number, y: number },
    currentPos: { x: number, y: number }
  }>
  @Input() lineWidth = 0;
  @Input() enableDraw = false;
  constructor(private el: ElementRef) { }

  private cx: CanvasRenderingContext2D;

  private resize() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    // set the width and height
    canvasEl.width = this.el.nativeElement.offsetWidth;
    canvasEl.height = this.el.nativeElement.offsetHeight;
    this.cx.fillStyle = "white";
    this.cx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    this.cx.lineWidth = this.lineWidth;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#cae22a52';
    this.resized.emit(true);
  }
  ngOnChanges() {
    if (this.cx)
      this.cx.lineWidth = this.lineWidth;
  }
  public ngAfterViewInit() {
    // get the context
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    // set the width and height
    canvasEl.width = this.el.nativeElement.offsetWidth;
    canvasEl.height = this.el.nativeElement.offsetHeight;

    this.clearEvent.subscribe(evt => {
      if (evt) {
        this.cx.fillStyle = "white";
        this.cx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      }
    });
    this.eraseEvent.subscribe((evt: {
      prevPos: { x: number, y: number },
      currentPos: { x: number, y: number }
    }) => {
      if (evt)
        this.clearOnCanvas(evt.prevPos, evt.currentPos);
    })
    // set some default properties about the line
    this.cx.lineWidth = this.lineWidth;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#cae22a52';

    // we'll implement this method to start capturing mouse events
    this.captureEvents(canvasEl);
    this.eventEmitters(canvasEl);
  }
  private eventEmitters(canvasEl) {
    const mouseEventToCoordinate = mouseEvent => {
      mouseEvent.preventDefault();
      const coords = canvasEl.getBoundingClientRect();
      return {
        x: mouseEvent.clientX - coords.left,
        y: mouseEvent.clientY - coords.top
      };
    };

    const touchEventToCoordinate = touchEvent => {
      touchEvent.preventDefault();
      const coords = canvasEl.getBoundingClientRect();
      return {
        x: touchEvent.changedTouches[0].clientX - coords.left,
        y: touchEvent.changedTouches[0].clientY - coords.top
      };
    };

    const mousedown = fromEvent(canvasEl, 'mousedown').pipe(map(mouseEventToCoordinate));
    const mousemove = fromEvent(canvasEl, 'mousemove').pipe(map(mouseEventToCoordinate));
    const mouseup = fromEvent(canvasEl, 'mouseup').pipe(map(mouseEventToCoordinate));
    const mouseleave = fromEvent(canvasEl, 'mouseleave').pipe(map(mouseEventToCoordinate));
    const touchstart = fromEvent(canvasEl, 'touchstart').pipe(map(touchEventToCoordinate));
    const touchmove = fromEvent(canvasEl, 'touchmove').pipe(map(touchEventToCoordinate));
    const touchend = fromEvent(canvasEl, 'touchend').pipe(map(touchEventToCoordinate));

    const starts = merge(mousedown, touchstart);
    const moves = merge(mousemove, touchmove);
    const ends = merge(mouseup, mouseleave, touchend);
    let maxy = 0;
    let maxx = 0;
    let minx = Infinity;
    let miny = Infinity;
    starts.pipe(
      tap((s) => {
        this.pointerMove.emit({
          x: s.x,
          y: s.y,
          type: 'start'
        })
      }),
      switchMap((s) => {
        return moves.pipe(
          map((e) => {
            if (s.x > maxx || e.x > maxx)
              maxx = s.x > e.x ? s.x : e.x;
            if (s.y > maxy || e.y > maxy)
              maxy = s.y > e.y ? s.y : e.y;
            if (s.x < minx || e.x < minx)
              minx = s.x < e.x ? s.x : e.x;
            if (s.y < miny || e.y < miny)
              miny = s.y < e.y ? s.y : e.y;
            this.pointerMove.emit({
              x: e.x,
              y: e.y,
              type: 'move'
            })
            return {
              start: { x: minx, y: miny },
              end: { x: maxx, y: maxy },
              last: e
            }
          }),
          takeUntil(ends),
          takeLast(1),
        )
      })
    ).subscribe(evt => {
      maxx = 0;
      maxy = 0;
      minx = Infinity;
      miny = Infinity;
      this.pointerMove.emit({
        x: evt.last.x,
        y: evt.last.y,
        type: 'end'
      })
      this.sketch.emit(new SketchEvent(evt.start, evt.end, canvasEl));
    })
  }
  private captureEvents(canvasEl: HTMLCanvasElement) {
    // this will capture all mousedown events from the canvas element
    fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e) => {
          // after a mouse down, we'll record all mouse moves
          return fromEvent(canvasEl, 'mousemove')
            .pipe(
              // we'll stop (and unsubscribe) once the user releases the mouse
              // this will trigger a 'mouseup' event    
              takeUntil(fromEvent(canvasEl, 'mouseup')),
              // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
              takeUntil(fromEvent(canvasEl, 'mouseleave')),
              // pairwise lets us get the previous value to draw a line from
              // the previous point to the current point    
              pairwise()
            )
        })
      )
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();

        // previous and current position with the offset
        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top
        };

        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };

        // this method we'll implement soon to do the actual drawing
        this.pos = [prevPos, currentPos];
        if (this.enableDraw)
          this.drawOnCanvas(prevPos, currentPos);
        this.stroke.emit({
          prevPos: prevPos,
          currentPos: currentPos,
        });
      });
    fromEvent(canvasEl, 'touchstart')
      .pipe(
        switchMap((e) => {
          return fromEvent(canvasEl, 'touchmove')
            .pipe(
              takeUntil(fromEvent(canvasEl, 'touchend')),
              pairwise()
            )
        })
      )
      .subscribe((res: [TouchEvent, TouchEvent]) => {

        const rect = canvasEl.getBoundingClientRect();

        // previous and current position with the offset
        const prevPos = {
          x: res[0].changedTouches[0].clientX - rect.left,
          y: res[0].changedTouches[0].clientY - rect.top
        };

        const currentPos = {
          x: res[1].changedTouches[0].clientX - rect.left,
          y: res[1].changedTouches[0].clientY - rect.top
        };

        // this method we'll implement soon to do the actual drawing
        this.pos = [prevPos, currentPos];
        this.drawOnCanvas(prevPos, currentPos);
        this.stroke.emit({
          prevPos: prevPos,
          currentPos: currentPos,
        });
      })
  }
  pos;

  private drawOnCanvas(
    prevPos: { x: number, y: number },
    currentPos: { x: number, y: number }
  ) {
    // incase the context is not set
    if (!this.cx) { return; }

    // start our drawing path
    this.cx.beginPath();

    // we're drawing lines so we need a previous position
    if (prevPos) {
      // sets the start point
      this.cx.moveTo(prevPos.x, prevPos.y); // from

      // draws a line from the start pos until the current position
      this.cx.lineTo(currentPos.x, currentPos.y);

      // strokes the current path with the styles we set earlier
      this.cx.stroke();
    }
  }

  private clearOnCanvas(
    prevPos: { x: number, y: number },
    currentPos: { x: number, y: number }
  ) {
    // incase the context is not set
    if (!this.cx) { return; }

    // start our drawing path
    this.cx.beginPath();

    // we're drawing lines so we need a previous position
    if (prevPos) {
      // set the stroke color to white
      this.cx.lineWidth = this.lineWidth;
      this.cx.strokeStyle = 'white';
      // sets the start point
      this.cx.moveTo(prevPos.x, prevPos.y); // from

      // draws a line from the start pos until the current position
      this.cx.lineTo(currentPos.x, currentPos.y);

      // strokes the current path with the styles we set earlier
      this.cx.stroke();
      this.cx.strokeStyle = '#cae22a52';
      this.cx.lineWidth = this.lineWidth;
    }
  }

}