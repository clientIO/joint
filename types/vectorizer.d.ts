export function V(svg: SVGElement | string): Vectorizer;

export class Vectorizer {
    constructor(svg: SVGElement);

    node: SVGElement;

    append(node: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]): Vectorizer;

    attr(): object;
    attr(name: string, value: string | number): Vectorizer;
    attr(attrs: object): Vectorizer;

    addClass(className: string): Vectorizer;

    clone(): Vectorizer;

    index(): number;

    removeClass(className: string): Vectorizer;

    scale(): { sx: number, sy: number };
    scale(sx: number, sy?: number): void;

    svg(): Vectorizer;

    transform(matrix: SVGMatrix, opt: any): Vectorizer
    transform(): SVGMatrix;

    translate(tx: number, ty?: number): Vectorizer;
}
