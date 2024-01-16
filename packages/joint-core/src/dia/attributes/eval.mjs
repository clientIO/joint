import { isCalcAttribute, evalCalcAttribute } from './calc.mjs';

const calcAttributesList = [
    'transform',
    'x',
    'y',
    'cx',
    'cy',
    'dx',
    'dy',
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

export function evalAttributes(attrs, refBBox) {
    const evalAttrs = {};
    for (let attrName in attrs) {
        if (!attrs.hasOwnProperty(attrName)) continue;
        evalAttrs[attrName] = evalAttribute(attrName, attrs[attrName], refBBox);
    }
    return evalAttrs;
}

export function evalAttribute(attrName, attrValue, refBBox) {
    if (attrName in calcAttributes && isCalcAttribute(attrValue)) {
        let evalAttrValue = evalCalcAttribute(attrValue, refBBox);
        if (attrName in positiveValueAttributes) {
            evalAttrValue = Math.max(0, evalAttrValue);
        }
        return evalAttrValue;
    }
    return attrValue;
}
