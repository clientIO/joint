const props = { w: 'w', W: 'W', h: 'h', H: 'H' };
const propsList = `${props.W}${props.w}${props.H}${props.h}`;
const numberPattern = '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?';
const findSpacesRegex = /\s/g;
const findExpressionsRegExp = /calc\(([^)]*)\)/g;
const parseExpressionRegExp = new RegExp(`^(${numberPattern}\\*)?([${propsList}])([-+]${numberPattern})?$`, 'g');

export function evalExpression(expression, bbox) {
    const match = parseExpressionRegExp.exec(expression.replace(findSpacesRegex, ''));
    if (!match) throw new Error(`Invalid calc() expression: ${expression}`);
    parseExpressionRegExp.lastIndex = 0; // reset regex results for the next run
    const [,multiply = 1, property, add = 0] = match;
    const { x, y, width, height } = bbox;
    const [offset, dimension] = {
        [props.W]: [x, width],
        [props.w]: [0, width],
        [props.H]: [y, height],
        [props.h]: [0, height]
    }[property];
    return offset + parseFloat(multiply) * dimension + parseFloat(add);
}

export function isCalcExpression(value) {
    return typeof value === 'string' && value.includes('calc');
}

export function calcSetWrapper(attribute) {
    return function calcSet(value, refBBox) {
        const evaluated = value.replace(findExpressionsRegExp, function(_, expression) {
            return evalExpression(expression, refBBox);
        });
        return { [attribute]: evaluated };
    };
}
