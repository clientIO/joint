declare namespace joint {
    function V(svg: SVGElement): Vectorizer;

    class Vectorizer {
        constructor(svg: SVGElement);

        // TODO sever more methods to add

        addClass(className: string): Vectorizer;

        clone(): Vectorizer;

        index(): number;

        removeClass(className: string): Vectorizer;

        scale(): {sx: number, sy: number};
        scale(sx: number, sy?: number): void;

        svg(): Vectorizer;

        transform(matrix: SVGMatrix, opt: any): Vectorizer
        transform(): SVGMatrix;

        translate(tx: number, ty?: number): Vectorizer;
    }
}
