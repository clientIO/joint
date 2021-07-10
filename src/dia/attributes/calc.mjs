const props = {
    width: 'w',
    height: 'h',
    minimum: 's',
    maximum: 'l',
    diagonal: 'd'
};
const propsList = Object.keys(props).map(key => props[key]).join('');
const numberPattern = '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?';
const findSpacesRegex = /\s/g;
const findExpressionsRegExp = /calc\(([^)]*)\)/g;
const parseExpressionRegExp = new RegExp(`^(${numberPattern}\\*)?([${propsList}])([-+]${numberPattern})?$`, 'g');

export function evalCalcExpression(expression, bbox) {
    const match = parseExpressionRegExp.exec(expression.replace(findSpacesRegex, ''));
    if (!match) throw new Error(`Invalid calc() expression: ${expression}`);
    parseExpressionRegExp.lastIndex = 0; // reset regex results for the next run
    const [,multiply = 1, property, add = 0] = match;
    // Note: currently, we do not take x and y into account
    const { width, height } = bbox;
    let dimension = 0;
    switch (property) {
        case props.width: {
            dimension = width;
            break;
        }
        case props.height: {
            dimension = height;
            break;
        }
        case props.minimum: {
            dimension = Math.min(height, width);
            break;
        }
        case props.maximum: {
            dimension = Math.max(height, width);
            break;
        }
        case props.diagonal: {
            dimension = Math.sqrt((height * height) + (width * width));
            break;
        }
    }
    return parseFloat(multiply) * dimension + parseFloat(add);
}

export function isCalcAttribute(value) {
    return typeof value === 'string' && value.includes('calc');
}

export function evalCalcAttribute(value, refBBox) {
    return value.replace(findExpressionsRegExp, function(_, expression) {
        return evalCalcExpression(expression, refBBox);
    });
}
