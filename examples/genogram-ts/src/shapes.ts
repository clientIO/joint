import { dia, shapes, util } from '@joint/core';
import { colors, sizes, defaultZIndex } from './theme';

// Male: rectangle (blue)
const maleMarkup = util.svg`
    <rect @selector="body"/>
    <text @selector="age"/>
    <text @selector="name"/>
`;

// Female: ellipse (pink)
const femaleMarkup = util.svg`
    <ellipse @selector="body"/>
    <text @selector="age"/>
    <text @selector="name"/>
`;

// Unknown: polygon/diamond (gray)
const unknownMarkup = util.svg`
    <polygon @selector="body"/>
    <text @selector="age"/>
    <text @selector="name"/>
`;

const { symbolWidth, symbolHeight } = sizes;

const commonAttrs = () => ({
    age: {
        textVerticalAnchor: 'middle' as const,
        textAnchor: 'middle' as const,
        x: 'calc(0.5*w)',
        y: 'calc(0.5*h)',
        fontSize: 16,
        fontFamily: 'Arial, helvetica, sans-serif',
        fontWeight: 'bold' as const,
        fill: colors.dark,
        text: '',
        stroke: colors.white,
        strokeWidth: 3,
        paintOrder: 'stroke' as const
    },
    name: {
        textVerticalAnchor: 'top' as const,
        textAnchor: 'middle' as const,
        x: 'calc(0.5*w)',
        y: 'calc(h+4)',
        fontSize: 11,
        fontFamily: 'Arial, helvetica, sans-serif',
        fill: colors.dark,
        textWrap: {
            width: `calc(w+${sizes.nameWrapOverlap * 2})`,
            maxLineCount: sizes.nameMaxLineCount,
            ellipsis: true
        }
    }
});

export class MalePerson extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'genogram.MalePerson',
            size: { width: symbolWidth, height: symbolHeight },
            z: defaultZIndex.person,
            attrs: {
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: colors.maleFill,
                    stroke: colors.maleStroke,
                    strokeWidth: 2,
                    rx: 4,
                    ry: 4
                },
                ...commonAttrs()
            }
        };
    }

    preinitialize() {
        this.markup = maleMarkup;
    }
}

export class FemalePerson extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'genogram.FemalePerson',
            size: { width: symbolWidth, height: symbolHeight },
            z: defaultZIndex.person,
            attrs: {
                body: {
                    cx: 'calc(0.5*w)',
                    cy: 'calc(0.5*h)',
                    rx: 'calc(0.5*w)',
                    ry: 'calc(0.5*h)',
                    fill: colors.femaleFill,
                    stroke: colors.femaleStroke,
                    strokeWidth: 2
                },
                ...commonAttrs()
            }
        };
    }

    preinitialize() {
        this.markup = femaleMarkup;
    }
}

export class UnknownPerson extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'genogram.UnknownPerson',
            size: { width: symbolWidth, height: symbolHeight },
            z: defaultZIndex.person,
            attrs: {
                body: {
                    points: 'calc(0.5*w),0 calc(w),calc(0.5*h) calc(0.5*w),calc(h) 0,calc(0.5*h)',
                    fill: colors.unknownFill,
                    stroke: colors.unknownStroke,
                    strokeWidth: 2
                },
                ...commonAttrs()
            }
        };
    }

    preinitialize() {
        this.markup = unknownMarkup;
    }
}

// --- Link shapes ---

export class ParentChildLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'genogram.ParentChildLink',
            z: defaultZIndex.parentChildLink,
            attrs: {
                line: {
                    stroke: colors.dark,
                    strokeWidth: 1.5,
                    targetMarker: null,
                }
            }
        }, super.defaults);
    }
}

export class MateLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'genogram.MateLink',
            z: defaultZIndex.mateLink,
            attrs: {
                line: {
                    stroke: colors.mateStroke,
                    strokeWidth: 3,
                    targetMarker: null,
                }
            },
        }, super.defaults);
    }
}

export class IdenticalLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'genogram.IdenticalLink',
            z: defaultZIndex.identicalLink,
            attrs: {
                line: {
                    stroke: colors.identicalStroke,
                    strokeWidth: 1.5,
                    strokeDasharray: '4 2',
                    targetMarker: null,
                }
            },
        }, super.defaults);
    }
}
