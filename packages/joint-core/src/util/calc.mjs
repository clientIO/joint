const props = {
    x: 'x',
    y: 'y',
    width: 'w',
    height: 'h',
    minimum: 's',
    maximum: 'l',
    diagonal: 'd'
};
const propsList = Object.keys(props).map(key => props[key]).join('');
const numberPattern = '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?';
const findSpacesRegex = /\s/g;
const parseFormulaRegExp = new RegExp(`^(${numberPattern}\\*)?([${propsList}])(/${numberPattern})?([-+]{1,2}${numberPattern})?$`, 'g');

function throwInvalid(expression) {
    throw new Error(`Invalid calc() expression: ${expression}`);
}

/*
* Evaluate the given calc formula.
* e.g. 'w + 10' in a rect 100x100 -> 110
*/
export function evalCalcFormula(formula, rect) {
    const match = parseFormulaRegExp.exec(formula.replace(findSpacesRegex, ''));
    if (!match) throwInvalid(formula);
    parseFormulaRegExp.lastIndex = 0; // reset regex results for the next run
    const [,multiply, property, divide, add] = match;
    const { x, y, width, height } = rect;
    let value = 0;
    switch (property) {
        case props.width: {
            value = width;
            break;
        }
        case props.height: {
            value = height;
            break;
        }
        case props.x: {
            value = x;
            break;
        }
        case props.y: {
            value = y;
            break;
        }
        case props.minimum: {
            value = Math.min(height, width);
            break;
        }
        case props.maximum: {
            value = Math.max(height, width);
            break;
        }
        case props.diagonal: {
            value = Math.sqrt((height * height) + (width * width));
            break;
        }
    }
    if (multiply) {
        // e.g "2*"
        value *= parseFloat(multiply);
    }
    if (divide) {
        // e.g "/2"
        value /= parseFloat(divide.slice(1));
    }
    if (add) {
        value += evalAddExpression(add);
    }
    return value;
}

function evalAddExpression(addExpression) {
    if (!addExpression) return 0;
    const [sign] = addExpression;
    switch (sign) {
        case '+': {
            return parseFloat(addExpression.substr(1));
        }
        case '-': {
            return -parseFloat(addExpression.substr(1));
        }
    }
    return parseFloat(addExpression);
}

/*
* Check if the given value is a calc expression.
* e.g. 'calc(10 + 100)' -> true
*/
export function isCalcExpression(value) {
    return typeof value === 'string' && value.includes('calc');
}

const calcStart = 'calc(';
const calcStartOffset = calcStart.length;

/*
* Evaluate all calc formulas in the given expression.
* e.g. 'calc(w + 10)' in rect 100x100 -> '110'
*/
export function evalCalcExpression(expression, rect) {
    let value = expression;
    let startSearchIndex = 0;
    do {
        let calcIndex = value.indexOf(calcStart, startSearchIndex);
        if (calcIndex === -1) return value;
        let calcEndIndex = calcIndex + calcStartOffset;
        let brackets = 1;
        findClosingBracket: do {
            switch (value[calcEndIndex]) {
                case '(': {
                    brackets++;
                    break;
                }
                case ')': {
                    brackets--;
                    if (brackets === 0) break findClosingBracket;
                    break;
                }
                case undefined: {
                    // Could not find the closing bracket.
                    throwInvalid(value);
                }
            }
            calcEndIndex++;
        } while (true);
        // Get the calc() expression without nested calcs (recursion)
        let expression = value.slice(calcIndex + calcStartOffset, calcEndIndex);
        if (isCalcExpression(expression)) {
            expression = evalCalcExpression(expression, rect);
        }
        // Eval the calc() expression without nested calcs.
        const calcValue = String(evalCalcFormula(expression, rect));
        // Replace the calc() expression and continue search
        value = value.slice(0, calcIndex) + calcValue + value.slice(calcEndIndex + 1);
        startSearchIndex = calcIndex + calcValue.length;
    } while (true);
}
