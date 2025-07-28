import { shapes, util, dia, g } from '@joint/core';

export const PADDING = 10;
export const HEADER_HEIGHT = 30;
export const HEADER_MIN_WIDTH = 140;

export class Base extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'container.Base'
        };
    }

    fitAncestorElements() {
        this.fitParent({
            deep: true,
            padding: {
                top: HEADER_HEIGHT + PADDING,
                left: PADDING,
                right: PADDING,
                bottom: PADDING
            }
        });
    }

    static filter(cell: dia.Cell) {
        // Hide any element or link which is embedded inside a collapsed parent (or parent of the parent).
        const hidden = cell.getAncestors().some((ancestor) => {
            if ((ancestor as Container).isCollapsed()) return true;
        });
        return !hidden;
    }
}

const childMarkup = util.svg/* xml */`
    <rect @selector="shadow"/>
    <rect @selector="body"/>
    <text @selector="label"/>
`;

export class Child extends Base {
    preinitialize() {
        this.markup = childMarkup;
    }

    defaults() {
        return {
            ...super.defaults,
            type: 'container.Child',
            size: { width: 50, height: 50 },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                shadow: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    x: 3,
                    y: 3,
                    fill: '#000000',
                    opacity: 0.2
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    strokeWidth: 1,
                    stroke: '#FF4365',
                    fill: '#F9DBDF'
                },
                label: {
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    x: 'calc(w / 2)',
                    y: 'calc(h / 2)',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fill: '#222222'
                }
            }
        };
    }

    static isChild(obj: any) {
        return obj instanceof Child;
    }
}

const containerMarkup = util.svg/* xml */`
    <rect @selector="shadow"/>
    <rect @selector="body"/>
    <rect @selector="header"/>
    <text @selector="headerText"/>
`;

export class Container extends Base {
    preinitialize() {
        this.markup = containerMarkup;
    }

    defaults() {
        return {
            ...super.defaults,
            type: 'container.Container',
            size: { width: 10, height: 10 },
            collapsed: false,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                shadow: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    x: 3,
                    y: 3,
                    fill: '#000000',
                    opacity: 0.05
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    strokeWidth: 1,
                    stroke: '#DDDDDD',
                    fill: '#FCFCFC'
                },
                header: {
                    width: 'calc(w)',
                    height: HEADER_HEIGHT,
                    strokeWidth: 0.5,
                    stroke: '#4666E5',
                    fill: '#4666E5'
                },
                headerText: {
                    textVerticalAnchor: 'middle',
                    textAnchor: 'start',
                    x: 8,
                    y: HEADER_HEIGHT / 2,
                    fontSize: 16,
                    fontFamily: 'sans-serif',
                    letterSpacing: 1,
                    fill: '#FFFFFF',
                    textWrap: {
                        width: -40,
                        maxLineCount: 1,
                        ellipsis: '*'
                    },
                    style: {
                        textShadow: '1px 1px #222222'
                    }
                }
            }
        };
    }

    toggle(shouldCollapse?: boolean): void {
        this.set(
            'collapsed',
            typeof shouldCollapse === 'boolean'
                ? shouldCollapse
                : !this.get('collapsed')
        );
    }

    isCollapsed(): boolean {
        return Boolean(this.get('collapsed'));
    }

    fitToChildElements(): void {
        // adjust position and size based on children
        const padding = {
            top: HEADER_HEIGHT + PADDING,
            left: PADDING,
            right: PADDING,
            bottom: PADDING
        };
        this.fitToChildren({
            filter: Base.filter,
            padding
        });

        // make sure that size is at least minimum
        const { x, y } = this.position();
        const minRect = new g.Rect({
            x,
            y,
            width: HEADER_MIN_WIDTH,
            height: HEADER_HEIGHT
        });
        this.fitToChildren({
            minRect,
            filter: Base.filter,
            padding
        });
    }

    static isContainer(obj: any) {
        return obj instanceof Container;
    }
}

export class Link extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'container.Link',
            attrs: {
                line: {
                    stroke: '#222222',
                    strokeWidth: 1,
                    targetMarker: {
                        'd': 'M 4 -4 0 0 4 4 M 7 -4 3 0 7 4 M 10 -4 6 0 10 4',
                        'fill': 'none'
                    }
                }
            }
        }, super.defaults);
    }
}
