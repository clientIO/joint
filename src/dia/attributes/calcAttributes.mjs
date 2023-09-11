import { isCalcAttribute, evalCalcAttribute } from './calc.mjs';

const calcAttributesList = [
    'transform',
    'x',
    'y',
    'cx',
    'cy',
    'x1',
    'y1',
    'x2',
    'y2',
    'points',
    'd',
    'r',
    'rx',
    'ry',
    'width',
    'height',
    'stroke-width',
    'font-size',
];
const positiveValueList = [
    'r',
    'rx',
    'ry',
    'width',
    'height',
    'stroke-width',
    'font-size',
];

const calcAttributes = calcAttributesList.reduce((acc, attrName) => {
    acc[attrName] = true;
    return acc;
}, {});

const positiveValueAttributes = positiveValueList.reduce((acc, attrName) => {
    acc[attrName] = true;
    return acc;
}, {});

export function evalCalcAttributes(attrs, refBBox) {
    for (let attrName in attrs) {
        if (!attrs.hasOwnProperty(attrName)) continue;
        let value = attrs[attrName];
        if (attrName in calcAttributes && isCalcAttribute(value)) {
            value = evalCalcAttribute(value, refBBox);
            if (attrName in positiveValueAttributes) {
                value = Math.max(0, value);
            }
            attrs[attrName] = value;
        }
    }
    return attrs;
}
