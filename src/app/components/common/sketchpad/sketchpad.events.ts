export class SketchEvent{
    start: {x:number, y:number};
    end: {x:number, y:number};
    canvas: Element;
    constructor(s, e, c){
        this.start = s;
        this.end = e;
        this.canvas = c;
    }
}