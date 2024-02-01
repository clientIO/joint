import { dia, elementTools, V, Vectorizer } from '@joint/core';

export interface RadiusControlOptions extends elementTools.Control.Options {

    /**
     * The selector of an element, which we want to modify the `rx` and `ry` attribute of.
     */
    selector: string;

    /** The value of the radius after reset.
     *
     * `Boolean` - When set to `false` the reset feature is disabled.
     *
     * `Number` - The value of the radius.
     *
     */
    defaultRadius?: boolean | number;
}

/**
 * ![alt text](media://joint-social.png)
 *
 * [[include:joint-element-tools/RadiusControl.md]]
 *
 * @category Shape-Independent
 */
 export class RadiusControl extends elementTools.Control<RadiusControlOptions> {

    /** @ignore */
    children = [{
        tagName: 'circle',
        selector: 'handle',
        attributes: {
            'cursor': 'pointer',
            'stroke-width': 2,
            'stroke': '#FFFFFF',
            'fill': '#33334F',
            'r': 6
        }
    }, {
        tagName: 'text',
        selector: 'extras',
        attributes: {
            'pointer-events': 'none',
            'fill': '#33334F',
            'text-anchor': 'end',
            'font-weight': 'bold',
            'font-size': 12
        }
    }]

    /**
     * The method converts the value of the `radius` to a string
     * to be displayed next to the handle.
     * */
    public printRadius(radius: number): string {
        return `R ${radius} `;
    }

    /**
     * The method returns the value of the current `radius`.
     * */
    public getRadius(): number {
        const { relatedView, options } = this;
        return relatedView.model.attr([options.selector, 'ry']) || 0;
    }

    /**
     * The method will set the new value of `radius` on the model.
     * The location is determined by the {@link RadiusControlOptions.selector | selector}.
     * */
    public setRadius(radius: number): void {
        const { relatedView, options } = this;
        relatedView.model.attr([options.selector], {
            rx: radius,
            ry: radius
        }, {
            ui: true,
            tool: this.cid
        });
    }

    protected updateExtras(extrasNode: SVGElement): void {
        const { relatedView, options } = this;
        const { selector, padding = 0 } = options;
        const magnet = relatedView.findNode(selector) as SVGElement;
        if (!magnet) return;
        const { model } = relatedView;
        const angle = model.angle();
        const radius = this.getRadius();
        const relativePoint = Vectorizer.transformPoint(
            relatedView.getNodeBoundingRect(magnet).topLeft(),
            relatedView.getNodeMatrix(magnet)
        ).offset(-padding, radius);
        const position = model.getAbsolutePointFromRelative(relativePoint);
        const extrasVEl = V(extrasNode);
        extrasVEl.attr('transform', `translate(${position.x},${position.y}) rotate(${angle})`);
        extrasVEl.text(this.printRadius(radius), { textVerticalAnchor: 'middle' });
    }

    protected getPosition(): dia.Point {
        const radius = this.getRadius();
        return { x: 0, y: radius };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point): void {
        const { model } = view;
        const { width, height } = model.size();
        const radius = Math.round(Math.min(Math.max(coordinates.y, 0), Math.max(height, width) / 2));
        this.setRadius(radius);
    }

    protected resetPosition(): void {
        const { defaultRadius = 0 } = this.options;
        if (defaultRadius === false) return;
        const radius = (defaultRadius === true) ? 0 : defaultRadius;
        this.setRadius(radius);
    }
}
