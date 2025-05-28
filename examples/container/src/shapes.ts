import { shapes, util, dia } from '@joint/core';

export const PADDING = 10;
export const HEADER_HEIGHT = 30;

class Base extends dia.Element {
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
                    refWidth: '100%',
                    refHeight: '100%',
                    x: 3,
                    y: 3,
                    fill: '#000000',
                    opacity: 0.2
                },
                body: {
                    refWidth: '100%',
                    refHeight: '100%',
                    strokeWidth: 1,
                    stroke: '#FF4365',
                    fill: '#F9DBDF'
                },
                label: {
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    refX: '50%',
                    refY: '50%',
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
                    refWidth: '100%',
                    refHeight: '100%',
                    x: 3,
                    y: 3,
                    fill: '#000000',
                    opacity: 0.05
                },
                body: {
                    refWidth: '100%',
                    refHeight: '100%',
                    strokeWidth: 1,
                    stroke: '#DDDDDD',
                    fill: '#FCFCFC'
                },
                header: {
                    refWidth: '100%',
                    height: HEADER_HEIGHT,
                    strokeWidth: 0.5,
                    stroke: '#4666E5',
                    fill: '#4666E5'
                },
                headerText: {
                    textVerticalAnchor: 'middle',
                    textAnchor: 'start',
                    refX: 8,
                    refY: HEADER_HEIGHT / 2,
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
                        textShadow: '1px 1px #222222',
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
        if (this.getEmbeddedCells().length === 0) {
            this.resize(140, 100);
        }
        this.fitToChildren({
            padding: {
                top: HEADER_HEIGHT + PADDING,
                left: PADDING,
                right: PADDING,
                bottom: PADDING
            }
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
