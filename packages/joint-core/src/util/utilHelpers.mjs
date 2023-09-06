// code is inspired by https://github.com/lodash/lodash

/* eslint-disable no-case-declarations */
// -- helper constants
const argsTag = '[object Arguments]';
const arrayTag = '[object Array]';
const boolTag = '[object Boolean]';
const dateTag = '[object Date]';
const errorTag = '[object Error]';
const funcTag = '[object Function]';
const mapTag = '[object Map]';
const numberTag = '[object Number]';
const nullTag = '[object Null]';
const objectTag = '[object Object]';
const regexpTag = '[object RegExp]';
const setTag = '[object Set]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';
const undefinedTag = '[object Undefined]';
const weakMapTag = '[object WeakMap]';
const arrayBufferTag = '[object ArrayBuffer]';
const dataViewTag = '[object DataView]';
const float32Tag = '[object Float32Array]';
const float64Tag = '[object Float64Array]';
const int8Tag = '[object Int8Array]';
const int16Tag = '[object Int16Array]';
const int32Tag = '[object Int32Array]';
const uint8Tag = '[object Uint8Array]';
const uint8ClampedTag = '[object Uint8ClampedArray]';
const uint16Tag = '[object Uint16Array]';
const uint32Tag = '[object Uint32Array]';

const CLONEABLE_TAGS = {
    [argsTag]: true,
    [arrayTag]: true,
    [arrayBufferTag]: true,
    [dataViewTag]: true,
    [boolTag]: true,
    [dateTag]: true,
    [float32Tag]: true,
    [float64Tag]: true,
    [int8Tag]: true,
    [int16Tag]: true,
    [int32Tag]: true,
    [mapTag]: true,
    [numberTag]: true,
    [objectTag]: true,
    [regexpTag]: true,
    [setTag]: true,
    [stringTag]: true,
    [symbolTag]: true,
    [uint8Tag]: true,
    [uint8ClampedTag]: true,
    [uint16Tag]: true,
    [uint32Tag]: true,
    [errorTag]: false,
    [funcTag]: false,
    [weakMapTag]: false,
};

/** Used to compose unicode character classes. */
const rsAstralRange = '\\ud800-\\udfff';
const rsComboMarksRange = '\\u0300-\\u036f';
const reComboHalfMarksRange = '\\ufe20-\\ufe2f';
const rsComboSymbolsRange = '\\u20d0-\\u20ff';
const rsComboMarksExtendedRange = '\\u1ab0-\\u1aff';
const rsComboMarksSupplementRange = '\\u1dc0-\\u1dff';
const rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange + rsComboMarksExtendedRange + rsComboMarksSupplementRange;
const rsDingbatRange = '\\u2700-\\u27bf';
const rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff';
const rsMathOpRange = '\\xac\\xb1\\xd7\\xf7';
const rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf';
const rsPunctuationRange = '\\u2000-\\u206f';
const rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000';
const rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde';
const rsVarRange = '\\ufe0e\\ufe0f';
const rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

/** Used to compose unicode capture groups. */
const rsApos = '[\'\u2019]';
const rsBreak = `[${rsBreakRange}]`;
const rsCombo = `[${rsComboRange}]`;
const rsDigit = '\\d';
const rsDingbat = `[${rsDingbatRange}]`;
const rsLower = `[${rsLowerRange}]`;
const rsMisc = `[^${rsAstralRange}${rsBreakRange + rsDigit + rsDingbatRange + rsLowerRange + rsUpperRange}]`;
const rsFitz = '\\ud83c[\\udffb-\\udfff]';
const rsModifier = `(?:${rsCombo}|${rsFitz})`;
const rsNonAstral = `[^${rsAstralRange}]`;
const rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
const rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
const rsUpper = `[${rsUpperRange}]`;
const rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
const rsMiscLower = `(?:${rsLower}|${rsMisc})`;
const rsMiscUpper = `(?:${rsUpper}|${rsMisc})`;
const rsOptContrLower = `(?:${rsApos}(?:d|ll|m|re|s|t|ve))?`;
const rsOptContrUpper = `(?:${rsApos}(?:D|LL|M|RE|S|T|VE))?`;
const reOptMod = `${rsModifier}?`;
const rsOptVar = `[${rsVarRange}]?`;
const rsOptJoin = `(?:${rsZWJ}(?:${[rsNonAstral, rsRegional, rsSurrPair].join('|')})${rsOptVar + reOptMod})*`;
const rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])';
const rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])';
const rsSeq = rsOptVar + reOptMod + rsOptJoin;
const rsEmoji = `(?:${[rsDingbat, rsRegional, rsSurrPair].join('|')})${rsSeq}`;

const reUnicodeWords = RegExp([
    `${rsUpper}?${rsLower}+${rsOptContrLower}(?=${[rsBreak, rsUpper, '$'].join('|')})`,
    `${rsMiscUpper}+${rsOptContrUpper}(?=${[rsBreak, rsUpper + rsMiscLower, '$'].join('|')})`,
    `${rsUpper}?${rsMiscLower}+${rsOptContrLower}`,
    `${rsUpper}+${rsOptContrUpper}`,
    rsOrdUpper,
    rsOrdLower,
    `${rsDigit}+`,
    rsEmoji
].join('|'), 'g');

const LARGE_ARRAY_SIZE = 200;
const HASH_UNDEFINED = '__hash_undefined__';

// Used to match `toStringTag` values of typed arrays
const reTypedTag = /^\[object (?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)Array\]$/;

// Used to compose unicode capture groups
const rsAstral = `[${rsAstralRange}]`;

// Used to compose unicode regexes
const rsNonAstralCombo = `${rsNonAstral}${rsCombo}?`;
const rsSymbol = `(?:${[rsNonAstralCombo, rsCombo, rsRegional, rsSurrPair, rsAstral].join('|')})`;

// Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode)
const reUnicode = RegExp(`${rsFitz}(?=${rsFitz})|${rsSymbol + rsSeq}`, 'g');

const reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
const reIsPlainProp = /^\w*$/;

const charCodeOfDot = '.'.charCodeAt(0);
const reEscapeChar = /\\(\\)?/g;
const rePropName = RegExp(
    // Match anything that isn't a dot or bracket.
    '[^.[\\]]+' + '|' +
  // Or match property names within brackets.
  '\\[(?:' +
    // Match a non-string expression.
    '([^"\'][^[]*)' + '|' +
    // Or match strings (supports escaping characters).
    '(["\'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2' +
  ')\\]'+ '|' +
  // Or match "" as the space between consecutive dots or empty brackets.
  '(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))'
    , 'g');
const reIsUint = /^(?:0|[1-9]\d*)$/;

const hasUnicodeWord = RegExp.prototype.test.bind(
    /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/
);

const MAX_ARRAY_INDEX = 4294967295 - 1;

/** Used to match words composed of alphanumeric characters. */
// eslint-disable-next-line no-control-regex
const reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;



// -- helper functions
const hasUnicode = (string) => {
    return reUnicode.test(string);
};

const unicodeToArray = (string) => {
    return string.match(reUnicode) || [];
};

const asciiToArray = (string) => {
    return string.split('');
};

const stringToArray = (string) => {
    return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
};

const values = (object) => {
    if (object == null) {
        return [];
    }

    return keys(object).map((key) => object[key]);
};

const keys = (object) => {
    return isArrayLike(object) ? arrayLikeKeys(object) : Object.keys(Object(object));
};

const baseKeys = (object) => {
    if (!isPrototype(object)) {
        return Object.keys(object);
    }
    var result = [];
    for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != 'constructor') {
            result.push(key);
        }
    }

    return result;
};

const arrayLikeKeys = (value, inherited) => {
    const isArr = Array.isArray(value);
    const isArg = !isArr && isObjectLike(value) && getTag(value) === argsTag;
    const isType = !isArr && !isArg && isTypedArray(value);
    const skipIndexes = isArr || isArg || isType;
    const length = value.length;
    const result = new Array(skipIndexes ? length : 0);
    let index = skipIndexes ? -1 : length;
    while (++index < length) {
        result[index] = `${index}`;
    }
    for (const key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) &&
            !(skipIndexes && (
                // Safari 9 has enumerable `arguments.length` in strict mode.
                key === 'length' ||
                // Skip index properties.
                isIndex(key, length)
            ))
        ) {
            result.push(key);
        }
    }
    return result;
};

const assocIndexOf = (array, key) => {
    let { length } = array;
    while (length--) {
        if (eq(array[length][0], key)) {
            return length;
        }
    }
    return -1;
};

const eq = (value, other) => {
    return value === other || (value !== value && other !== other);
};

const isObjectLike = (value) => {
    return value != null && typeof value == 'object';
};

const isIterateeCall = (value, index, object) => {
    if (!isObject(object)) {
        return false;
    }
    const type = typeof index;

    const isPossibleIteratee = type == 'number' ?
        (isArrayLike(object) && index > -1 && index < object.length) :
        (type == 'string' && index in object);

    if (isPossibleIteratee) {
        return eq(object[index], value);
    }
    return false;
};

const isSet = (value) => {
    return isObjectLike(value) && getTag(value) == setTag;
};

const isMap = (value) => {
    return isObjectLike(value) && getTag(value) == mapTag;
};

const isPrototype = (value) => {
    const Ctor = value && value.constructor;
    const proto = (typeof Ctor === 'function' && Ctor.prototype) || Object.prototype;

    return value === proto;
};

const assignValue = (object, key, value) => {
    const objValue = object[key];
    if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
        (value === undefined && !(key in object))) {
        object[key] = value;
    }
};

const copyObject = (source, props, object) => {
    let index = -1;
    const length = props.length;

    while (++index < length) {
        const key = props[index];
        assignValue(object, key, source[key]);
    }
    return object;
};

const isArrayLike = (value) => {
    return value != null && typeof value !== 'function' && typeof value.length === 'number' &&
        value.length > -1 && value.length % 1 === 0;
};

const isSymbol = (value) => {
    return typeof value == 'symbol' ||
        (isObjectLike(value) && getTag(value) === symbolTag);
};

const initCloneArray = (array) => {
    const length = array.length;
    let result = new array.constructor(length);

    if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
    }

    return result;
};

const copyArray = (source, array) => {
    let index = -1;
    const length = source.length;

    array || (array = new Array(length));
    while (++index < length) {
        array[index] = source[index];
    }
    return array;
};

const getTag = (value) => {
    if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
    }

    return Object.prototype.toString.call(value);
};

const cloneArrayBuffer = (arrayBuffer) => {
    const result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new Uint8Array(result).set(new Uint8Array(arrayBuffer));
    return result;
};

const cloneTypedArray = (typedArray, isDeep) => {
    const buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
};

const cloneRegExp = (regexp) =>{
    const result = new regexp.constructor(regexp.source, /\w*$/.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
};

const initCloneObject = (object) => {
    return (typeof object.constructor == 'function' && !isPrototype(object))
        ? Object.create(Object.getPrototypeOf(object))
        : {};
};

const getSymbols = (object) => {
    if (object == null) {
        return [];
    }

    object = Object(object);
    const symbols = Object.getOwnPropertySymbols(object);

    return symbols.filter((symbol) => propertyIsEnumerable.call(object, symbol));
};

const copySymbols = (source, object) => {
    return copyObject(source, getSymbols(source), object);
};

function cloneDataView(dataView, isDeep) {
    const buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

const initCloneByTag = (object, tag, isDeep) => {
    const Constructor = object.constructor;
    switch(tag) {
        case arrayBufferTag:
            return cloneArrayBuffer(object, isDeep);
        case boolTag:
        case dateTag:
            return new Constructor(+object);
        case dataViewTag:
            return cloneDataView(object, isDeep);
        case float32Tag:
        case float64Tag:
        case int8Tag:
        case int16Tag:
        case int32Tag:
        case uint8Tag:
        case uint8ClampedTag:
        case uint16Tag:
        case uint32Tag:
            return cloneTypedArray(object, isDeep);
        case mapTag:
            return new Constructor(object);
        case numberTag:
        case stringTag:
            return new Constructor(object);
        case regexpTag:
            return cloneRegExp(object);
        case setTag:
            return new Constructor;
        case symbolTag:
            return Symbol.prototype.valueOf ? Object(Symbol.prototype.valueOf.call(object)) : {};
    }
};

const isTypedArray = (value) => {
    return isObjectLike(value) && reTypedTag.test(getTag(value));
};

const getAllKeys = (object) => {
    const result = Object.keys(object);
    if(!Array.isArray(object) && object != null) {
        result.push(...getSymbols(Object(object)));
    }

    return result;
};

const getSymbolsIn = (object) => {
    const result = [];
    while (object) {
        result.push(...getSymbols(object));
        object = Object.getPrototypeOf(Object(object));
    }

    return result;
};

const getAllKeysIn = (object) => {
    const result = [];

    for (const key in object) {
        result.push(key);
    }

    if (!Array.isArray(object)) {
        result.push(...getSymbolsIn(object));
    }

    return result;
};

const getMapData = ({ __data__ }, key) => {
    const data = __data__;
    return isKeyable(key)
        ? data[typeof key === 'string' ? 'string' : 'hash']
        : data.map;
};

const equalObjects = (object, other, equalFunc, stack) => {
    const objProps = getAllKeys(object);
    const objLength = objProps.length;
    const othProps = getAllKeys(other);
    const othLength = othProps.length;

    if (objLength != othLength) {
        return false;
    }
    let key;
    let index = objLength;
    while (index--) {
        key = objProps[index];
        if (!(hasOwnProperty.call(other, key))) {
            return false;
        }
    }

    const objStacked = stack.get(object);
    const othStacked = stack.get(other);
    if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
    }
    let result = true;
    stack.set(object, other);
    stack.set(other, object);

    let compared;
    let skipCtor;

    while (++index < objLength) {
        key = objProps[index];
        const objValue = object[key];
        const othValue = other[key];

        if (!(compared === undefined
            ? (objValue === othValue || equalFunc(objValue, othValue, stack))
            : compared
        )) {
            result = false;
            break;
        }
        skipCtor || (skipCtor = key == 'constructor');
    }

    if (result && !skipCtor) {
        const objCtor = object.constructor;
        const othCtor = other.constructor;

        if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor === 'function' && objCtor instanceof objCtor &&
            typeof othCtor === 'function' && othCtor instanceof othCtor)) {
            result = false;
        }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
};

const baseIsEqual = (value, other, stack) => {
    if (value === other) {
        return true;
    }
    if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
    }

    return baseIsEqualDeep(value, other, baseIsEqual, stack);
};

const baseIsEqualDeep = (object, other, equalFunc, stack) => {
    let objIsArr = Array.isArray(object);
    const othIsArr = Array.isArray(other);
    let objTag = objIsArr ? arrayTag : getTag(object);
    let othTag = othIsArr ? arrayTag : getTag(other);

    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;

    let objIsObj = objTag == objectTag;
    const othIsObj = othTag == objectTag;
    const isSameTag = objTag == othTag;

    if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray(object))
            ? equalArrays(object, other, false, equalFunc, stack)
            : equalByTag(object, other, objTag, equalFunc, stack);
    }

    const objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__');
    const othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
        const objUnwrapped = objIsWrapped ? object.value() : object;
        const othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new Stack);
        return equalFunc(objUnwrapped, othUnwrapped, stack);
    }

    if (!isSameTag) {
        return false;
    }

    stack || (stack = new Stack);
    return equalObjects(object, other, equalFunc, stack);
};

const equalArrays = (array, other, compareUnordered, equalFunc, stack) => {
    const isPartial = false;
    const arrLength = array.length;
    const othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
    }
    // Assume cyclic values are equal.
    const arrStacked = stack.get(array);
    const othStacked = stack.get(other);
    if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array;
    }
    let index = -1;
    let result = true;
    const seen = compareUnordered ? new SetCache : undefined;

    stack.set(array, other);
    stack.set(other, array);

    while (++index < arrLength) {
        let compared;
        const arrValue = array[index];
        const othValue = other[index];

        if (compared !== undefined) {
            if (compared) {
                continue;
            }
            result = false;
            break;
        }

        if (seen) {
            if (!some(other, (othValue, othIndex) => {
                if (!cacheHas(seen, othIndex) &&
            (arrValue === othValue || equalFunc(arrValue, othValue, stack))) {
                    return seen.push(othIndex);
                }
            })) {
                result = false;
                break;
            }
        } else if (!(
            arrValue === othValue ||
            equalFunc(arrValue, othValue, stack)
        )) {
            result = false;
            break;
        }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
};

const some = (array, predicate) => {
    let index = -1;
    const length = array == null ? 0 : array.length;

    while (++index < length) {
        if (predicate(array[index], index, array)) {
            return true;
        }
    }
    return false;
};

const cacheHas = (cache, key) => {
    return cache.has(key);
};

const compareArrayBufferTag = (object, other, equalFunc, stack) => {
    if ((object.byteLength != other.byteLength) ||
                !equalFunc(new Uint8Array(object), new Uint8Array(other), stack)) {
        return false;
    }
    return true;
};

const equalByTag = (object, other, tag, equalFunc, stack) => {

    switch (tag) {
        case dataViewTag:
            if ((object.byteLength != other.byteLength) ||
                (object.byteOffset != other.byteOffset)) {
                return false;
            }
            object = object.buffer;
            other = other.buffer;
            return compareArrayBufferTag(object, other, equalFunc, stack);
        case arrayBufferTag:
            return compareArrayBufferTag(object, other, equalFunc, stack);
        case boolTag:
        case dateTag:
        case numberTag:
            return eq(+object, +other);
        case errorTag:
            return object.name == other.name && object.message == other.message;
        case regexpTag:
        case stringTag:
            return object == `${other}`;
        case mapTag:
            let convert = mapToArray;
        // Intentional fallthrough
        // eslint-disable-next-line no-fallthrough
        case setTag:
            convert || (convert = setToArray);

            if (object.size != other.size) {
                return false;
            }
            // Assume cyclic values are equal.
            const stacked = stack.get(object);
            if (stacked) {
                return stacked == other;
            }

            // Recursively compare objects (susceptible to call stack limits).
            stack.set(object, other);
            const result = equalArrays(convert(object), convert(other), true, equalFunc, stack);
            stack['delete'](object);
            return result;
        case symbolTag:
            return Symbol.prototype.valueOf.call(object) == Symbol.prototype.valueOf.call(other);
    }

    return false;
};

const mapToArray = (map) => {
    let index = -1;
    let result = Array(map.size);

    map.forEach((value, key) => {
        result[++index] = [key, value];
    });
    return result;
};

const setToArray = (set) => {
    let index = -1;
    const result = new Array(set.size);

    set.forEach((value) => {
        result[++index] = value;
    });
    return result;
};

const isKey = (value, object) => {
    if (Array.isArray(value)) {
        return false;
    }
    const type = typeof value;
    if (type === 'number' || type === 'boolean' || value == null || isSymbol(value)) {
        return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
};

const stringToPath = (string) => {
    const result = [];
    if (string.charCodeAt(0) === charCodeOfDot) {
        result.push('');
    }
    string.replace(rePropName, (match, expression, quote, subString) => {
        let key = match;
        if (quote) {
            key = subString.replace(reEscapeChar, '$1');
        }
        else if (expression) {
            key = expression.trim();
        }
        result.push(key);
    });
    return result;
};

const castPath = (path, object) => {
    if (Array.isArray(path)) {
        return path;
    }

    return isKey(path, object) ? [path] : stringToPath(`${path}`);
};

const get = (object, path) => {
    path = castPath(path, object);

    let index = 0;
    const length = path.length;

    while (object != null && index < length) {
        object = object[toKey(path[index])];
        index++;
    }

    return (index && index == length) ? object : undefined;
};

function compareAscending(value, other) {
    if (value !== other) {
        const valIsDefined = value !== undefined;
        const valIsNull = value === null;
        const valIsReflexive = value === value;
        const valIsSymbol = isSymbol(value);

        const othIsDefined = other !== undefined;
        const othIsNull = other === null;
        const othIsReflexive = other === other;
        const othIsSymbol = isSymbol(other);

        if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
            (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
            (valIsNull && othIsDefined && othIsReflexive) ||
            (!valIsDefined && othIsReflexive) ||
            !valIsReflexive) {
            return 1;
        }
        if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
            (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
            (othIsNull && valIsDefined && valIsReflexive) ||
            (!othIsDefined && valIsReflexive) ||
            !othIsReflexive) {
            return -1;
        }
    }
    return 0;
}

function compareMultiple(object, other, orders) {
    let index = -1;
    const objCriteria = object.criteria;
    const othCriteria = other.criteria;
    const length = objCriteria.length;
    const ordersLength = orders.length;

    while (++index < length) {
        const order = index < ordersLength ? orders[index] : null;
        const cmpFn = (order && typeof order === 'function') ? order : compareAscending;
        const result = cmpFn(objCriteria[index], othCriteria[index]);
        if (result) {
            if (order && typeof order !== 'function') {
                return result * (order == 'desc' ? -1 : 1);
            }
            return result;
        }
    }

    return object.index - other.index;
}

const diff = (array, values) => {
    let includes = (array, value) => {
        const length = array == null ? 0 : array.length;
        return !!length && array.indexOf(value) > -1;
    };
    let isCommon = true;
    const result = [];
    const valuesLength = values.length;

    if (!array.length) {
        return result;
    }

    if (values.length >= LARGE_ARRAY_SIZE) {
        includes = (cache, key) => cache.has(key);
        isCommon = false;
        values = new SetCache(values);
    }

    outer:
    for (let key in array) {
        let value = array[key];
        const computed = value;

        value = (value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
            let valuesIndex = valuesLength;
            while (valuesIndex--) {
                if (values[valuesIndex] === computed) {
                    continue outer;
                }
            }
            result.push(value);
        }
        else if (!includes(values, computed)) {
            result.push(value);
        }
    }

    return result;
};

const intersect = (arrays) => {
    const includes = (array, value) => {
        const length = array == null ? 0 : array.length;
        return !!length && array.indexOf(value) > -1;
    };
    const cacheHas = (cache, key) => cache.has(key);
    const length = arrays[0].length;
    const othLength = arrays.length;
    const caches = new Array(othLength);
    const result = [];

    let array;
    let maxLength = Infinity;
    let othIndex = othLength;

    while (othIndex--) {
        array = arrays[othIndex];

        maxLength = Math.min(array.length, maxLength);
        caches[othIndex] = length >= 120 && array.length >= 120
            ? new SetCache(othIndex && array)
            : undefined;
    }
    array = arrays[0];

    let index = -1;
    const seen = caches[0];

    outer:
    while (++index < length && result.length < maxLength) {
        let value = array[index];
        const computed = value;

        value = (value !== 0) ? value : 0;
        if (!(seen
            ? cacheHas(seen, computed)
            : includes(result, computed)
        )) {
            othIndex = othLength;
            while (--othIndex) {
                const cache = caches[othIndex];
                if (!(cache
                    ? cacheHas(cache, computed)
                    : includes(arrays[othIndex], computed))
                ) {
                    continue outer;
                }
            }
            if (seen) {
                seen.push(computed);
            }
            result.push(value);
        }
    }
    return result;
};

const toKey = (value) => {
    if (typeof value === 'string' || isSymbol(value)) {
        return value;
    }
    const result = `${value}`;
    return (result == '0' && (1 / value) == -Infinity) ? '-0' : result;
};

const baseClone = (value, isDeep = false, isFlat = false, isFull = true, customizer, key, object, stack) => {
    let result;

    if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
    }

    if (result !== undefined) {
        return result;
    }

    if (!isObject(value)) {
        return value;
    }

    const isArr = Array.isArray(value);
    const tag = getTag(value);

    if (isArr) {
        result = initCloneArray(value);

        if (!isDeep) {
            return copyArray(value, result);
        }
    } else {
        const isFunc = typeof value === 'function';

        if (tag === objectTag || tag === argsTag || (isFunc && !object)) {
            result = (isFlat || isFunc) ? {} : initCloneObject(value);
            if (!isDeep) {
                return isFlat ?
                    copySymbolsIn(value, copyObject(value, Object.keys(value), result)) :
                    copySymbols(value, Object.assign(result, value));
            }
        } else {
            if (isFunc || !CLONEABLE_TAGS[tag]) {
                return object ? value : {};
            }
            result = initCloneByTag(value, tag, isDeep);
        }
    }

    stack || (stack = new Stack);
    const stacked = stack.get(value);

    if (stacked) {
        return stacked;
    }

    stack.set(value, result);

    if (isMap(value)) {
        value.forEach((subValue, key) => {
            result.set(key, baseClone(subValue, isDeep, isFlat, isFull, customizer, key, value, stack));
        });

        return result;
    }

    if (isSet(value)) {
        value.forEach(subValue => {
            result.add(baseClone(subValue, isDeep, isFlat, isFull, customizer, subValue, value, stack));
        });

        return result;
    }

    if(isTypedArray(value)) {
        return result;
    }

    const keysFunc = isFull
        ? (isFlat ? getAllKeysIn : getAllKeys)
        : (isFlat ? keysIn : keys);

    const props =  isArr ? undefined : keysFunc(value);

    (props || value).forEach((subValue, key) => {
        if (props) {
            key = subValue;
            subValue = value[key];
        }

        assignValue(result, key, baseClone(subValue, isDeep, isFlat, isFull, customizer, key, value, stack));
    });

    return result;
};

const copySymbolsIn = (source, object) => {
    return copyObject(source, getSymbolsIn(source), object);
};

const parent = (object, path) => {
    return path.length < 2 ? object : get(object, path.slice(0, -1));
};

const set = (object, path, value) => {
    if (!isObject(object)) {
        return object;
    }
    path = castPath(path, object);

    const length = path.length;
    const lastIndex = length - 1;

    let index = -1;
    let nested = object;

    while (nested != null && ++index < length) {
        const key = toKey(path[index]);
        let newValue = value;

        if (index != lastIndex) {
            const objValue = nested[key];
            newValue = undefined;
            if (newValue === undefined) {
                newValue = isObject(objValue)
                    ? objValue
                    : (isIndex(path[index + 1]) ? [] : {});
            }
        }
        assignValue(nested, key, newValue);
        nested = nested[key];
    }
    return object;
};

const isIndex = (value, length) => {
    const type = typeof value;
    length = length == null ? Number.MAX_SAFE_INTEGER : length;

    return !!length &&
    (type === 'number' ||
        (type !== 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
};

const unset = (object, path) => {
    path = castPath(path, object);
    object = parent(object, path);
    const lastSegment = path[path.length - 1];
    return object == null || delete object[toKey(lastSegment)];
};

const isKeyable = (value) => {
    const type = typeof value;
    return (type === 'string' || type === 'number' || type === 'symbol' || type === 'boolean')
        ? (value !== '__proto__')
        : (value === null);
};

const keysIn = (object) => {
    const result = [];
    for (const key in object) {
        result.push(key);
    }
    return result;
};

const toPlainObject = (value) => {
    value = Object(value);
    const result = {};
    for (const key in value) {
        result[key] = value[key];
    }
    return result;
};

const safeGet = (object, key) => {
    if (key === 'constructor' && typeof object[key] === 'function') {
        return;
    }

    if (key == '__proto__') {
        return;
    }

    return object[key];
};

function createAssigner(assigner, isMerge = false) {
    return (object, ...sources) => {
        let index = -1;
        let length = sources.length;
        let customizer = length > 1 ? sources[length - 1] : undefined;
        const guard = length > 2 ? sources[2] : undefined;

        customizer = (assigner.length > 3 && typeof customizer === 'function')
            ? (length--, customizer)
            : isMerge ? (a, b) => {
                if (Array.isArray(a) && !Array.isArray(b)) {
                    return b;
                }
            } : undefined;

        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
            customizer = length < 3 ? undefined : customizer;
            length = 1;
        }
        object = Object(object);
        while (++index < length) {
            const source = sources[index];
            if (source) {
                assigner(object, source, index, customizer);
            }
        }
        return object;
    };
}

const baseMerge = (object, source, srcIndex, customizer, stack) => {
    if (object === source) {
        return;
    }

    forIn(source, (srcValue, key) => {
        if (isObject(srcValue)) {
            stack || (stack = new Stack);
            baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        } else {
            let newValue = customizer
                ? customizer(object[key], srcValue, `${key}`, object, source, stack)
                : undefined;

            if (newValue === undefined) {
                newValue = srcValue;
            }

            assignMergeValue(object, key, newValue);
        }
    }, keysIn);
};

const baseMergeDeep = (object, source, key, srcIndex, mergeFunc, customizer, stack) => {
    const objValue = safeGet(object, key);
    const srcValue = safeGet(source, key);
    const stacked = stack.get(srcValue);

    if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
    }

    let newValue = customizer
        ? customizer(objValue, srcValue, `${key}`, object, source, stack)
        : undefined;

    let isCommon = newValue === undefined;

    if (isCommon) {
        const isArr = Array.isArray(srcValue);
        const isTyped = !isArr && isTypedArray(srcValue);

        newValue = srcValue;
        if (isArr || isTyped) {
            if (Array.isArray(objValue)) {
                newValue = objValue;
            }
            else if (isObjectLike(objValue) && isArrayLike(objValue)) {
                newValue = copyArray(objValue);
            }
            else if (isTyped) {
                isCommon = false;
                newValue = cloneTypedArray(srcValue, true);
            }
            else {
                newValue = [];
            }
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
            newValue = objValue;
            if (isArguments(objValue)) {
                newValue = toPlainObject(objValue);
            }
            else if (typeof objValue === 'function' || !isObject(objValue)) {
                newValue = initCloneObject(srcValue);
            }
        }
        else {
            isCommon = false;
        }
    }
    if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack['delete'](srcValue);
    }
    assignMergeValue(object, key, newValue);
};

const assignMergeValue = (object, key, value) => {
    if ((value !== undefined && !eq(object[key], value)) ||
        (value === undefined && !(key in object))) {
        assignValue(object, key, value);
    }
};

function baseFor(object, iteratee, keysFunc) {
    const iterable = Object(object);
    const props = keysFunc(object);
    let { length } = props;
    let index = -1;

    while (length--) {
        const key = props[++index];
        if (iteratee(iterable[key], key, iterable) === false) {
            break;
        }
    }
    return object;
}

const baseForOwn = (object, iteratee) => {
    return object && baseFor(object, iteratee, keys);
};

const baseEach = (collection, iteratee) => {
    if (collection == null) {
        return collection;
    }
    if (!isArrayLike(collection)) {
        return baseForOwn(collection, iteratee);
    }
    const length = collection.length;
    const iterable = Object(collection);
    let index = -1;

    while (++index < length) {
        if (iteratee(iterable[index], index, iterable) === false) {
            break;
        }
    }
    return collection;
};

function last(array) {
    const length = array == null ? 0 : array.length;
    return length ? array[length - 1] : undefined;
}

const createSet = (Set && (1 / setToArray(new Set([undefined,-0]))[1]) == 1 / 0)
    ? (values) => new Set(values)
    : () => {};

function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
    if (isObject(objValue) && isObject(srcValue)) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, objValue);
        baseMerge(objValue, srcValue, undefined, customDefaultsMerge, stack);
        stack['delete'](srcValue);
    }
    return objValue;
}

function baseOrderBy(collection, iteratees, orders) {
    if (iteratees.length) {
        iteratees = iteratees.map((iteratee) => {
            if (Array.isArray(iteratee)) {
                return (value) => get(value, iteratee.length === 1 ? iteratee[0] : iteratee);
            }

            return iteratee;
        });
    } else {
        iteratees = [(value) => value];
    }

    let criteriaIndex = -1;
    let eachIndex = -1;

    const result = isArrayLike(collection) ? new Array(collection.length) : [];

    baseEach(collection, (value) => {
        const criteria = iteratees.map((iteratee) => iteratee(value));

        result[++eachIndex] = {
            criteria,
            index: ++criteriaIndex,
            value
        };
    });

    return baseSortBy(result, (object, other) => compareMultiple(object, other, orders));
}

function baseSortBy(array, comparer) {
    let { length } = array;

    array.sort(comparer);
    while (length--) {
        array[length] = array[length].value;
    }
    return array;
}

function isStrictComparable(value) {
    return value === value && !isObject(value);
}

function matchesStrictComparable(key, srcValue) {
    return (object) => {
        if (object == null) {
            return false;
        }
        return object[key] === srcValue &&
            (srcValue !== undefined || (key in Object(object)));
    };
}

function hasIn(object, path) {
    return object != null && hasPath(object, path, baseHasIn);
}

function baseMatchesProperty(path, srcValue) {
    if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
    }
    return (object) => {
        const objValue = get(object, path);
        return (objValue === undefined && objValue === srcValue)
            ? hasIn(object, path)
            : baseIsEqual(srcValue, objValue);
    };
}

function baseMatches(source) {
    const matchData = getMatchData(source);
    if (matchData.length === 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return (object) => object === source || baseIsMatch(object, source, matchData);
}

function getMatchData(object) {
    const result = keys(object);
    let length = result.length;

    while (length--) {
        const key = result[length];
        const value = object[key];
        result[length] = [key, value, isStrictComparable(value)];
    }
    return result;
}

function baseIsMatch(object, source, matchData, customizer) {
    let index = matchData.length;
    const length = index;
    const noCustomizer = !customizer;

    if (object == null) {
        return !length;
    }
    let data;
    let result;
    object = Object(object);
    while (index--) {
        data = matchData[index];
        if ((noCustomizer && data[2])
            ? data[1] !== object[data[0]]
            : !(data[0] in object)
        ) {
            return false;
        }
    }
    while (++index < length) {
        data = matchData[index];
        const key = data[0];
        const objValue = object[key];
        const srcValue = data[1];

        if (noCustomizer && data[2]) {
            if (objValue === undefined && !(key in object)) {
                return false;
            }
        } else {
            const stack = new Stack;
            if (customizer) {
                result = customizer(objValue, srcValue, key, object, source, stack);
            }
            if (!(result === undefined
                ? baseIsEqual(srcValue, objValue, stack)
                : result
            )) {
                return false;
            }
        }
    }
    return true;
}

function property(path) {
    return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

function baseProperty(key) {
    return (object) => object == null ? undefined : object[key];
}

function basePropertyDeep(path) {
    return (object) => get(object, path);
}

function baseIteratee(value) {
    if (typeof value == 'function') {
        return value;
    }
    if (value == null) {
        return (val) => val;
    }
    if (typeof value == 'object') {
        return Array.isArray(value)
            ? baseMatchesProperty(value[0], value[1])
            : baseMatches(value);
    }
    return property(value);
}

function getIteratee() {
    const result = baseIteratee;
    return arguments.length ? result(arguments[0], arguments[1]) : result;
}

const arrayReduce = (array, iteratee, accumulator, initAccum) => {
    let index = -1;
    const length = array == null ? 0 : array.length;

    if (initAccum && length) {
        accumulator = array[++index];
    }
    while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
};

const baseReduce = (collection, iteratee, accumulator, initAccum, eachFunc) => {
    eachFunc(collection, (value, index, collection) => {
        accumulator = initAccum
            ? (initAccum = false, value)
            : iteratee(accumulator, value, index, collection);
    });
    return accumulator;
};

function reduce(collection, iteratee, accumulator) {
    const func = Array.isArray(collection) ? arrayReduce : baseReduce;
    const initAccum = arguments.length < 3;
    return func(collection, iteratee, accumulator, initAccum, baseEach);
}

const isFlattenable = (value) => {
    return Array.isArray(value) || isArguments(value) ||
    !!(value && value[Symbol.isConcatSpreadable]);
};

function baseFlatten(array, depth, predicate, isStrict, result) {
    let index = -1;
    const length = array.length;

    predicate || (predicate = isFlattenable);
    result || (result = []);

    while (++index < length) {
        var value = array[index];
        if (depth > 0 && predicate(value)) {
            if (depth > 1) {
                // Recursively flatten arrays (susceptible to call stack limits).
                baseFlatten(value, depth - 1, predicate, isStrict, result);
            } else {
                result.push(...value);
            }
        } else if (!isStrict) {
            result[result.length] = value;
        }
    }
    return result;
}

const isArguments = (value) => {
    return isObjectLike(value) && getTag(value) == '[object Arguments]';
};

const basePick = (object, paths) => {
    return basePickBy(object, paths, (value, path) => hasIn(object, path));
};

const basePickBy = (object, paths, predicate) => {
    let index = -1;
    const length = paths.length;
    const result = {};

    while (++index < length) {
        const path = paths[index];
        const value = get(object, path);
        if (predicate(value, path)) {
            set(result, castPath(path, object), value);
        }
    }
    return result;
};

const isLength = (value) => {
    return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= Number.MAX_SAFE_INTEGER;
};

const baseHasIn = (object, key) =>{
    return object != null && key in Object(object);
};

const hasPath = (object, path, hasFunc) => {
    path = castPath(path, object);

    var index = -1,
        length = path.length,
        result = false;

    while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
            break;
        }
        object = object[key];
    }
    if (result || ++index != length) {
        return result;
    }
    length = object == null ? 0 : object.length;
    return !!length && isLength(length) && isIndex(key, length) &&
        (Array.isArray(object) || isArguments(object));
};

const asciiWords = (string) => {
    return string.match(reAsciiWord);
};

const unicodeWords = (string) => {
    return string.match(reUnicodeWords);
};

const words = (string, pattern) => {
    if (pattern === undefined) {
        const result = hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
        return result || [];
    }
    return string.match(pattern) || [];
};

const castSlice = (array, start, end) => {
    const { length } = array;
    end = end === undefined ? length : end;
    return (!start && end >= length) ? array : array.slice(start, end);
};

const upperFirst = createCaseFirst('toUpperCase');

function createCaseFirst(methodName) {
    return (string) => {
        if (!string) {
            return '';
        }

        const strSymbols = hasUnicode(string)
            ? stringToArray(string)
            : undefined;

        const chr = strSymbols
            ? strSymbols[0]
            : string[0];

        const trailing = strSymbols
            ? castSlice(strSymbols, 1).join('')
            : string.slice(1);

        return chr[methodName]() + trailing;
    };
}

export function matches(source) {
    return baseMatches(baseClone(source, true));
}

// -- helper classes
class Stack {
    constructor(entries) {
        const data = this.__data__ = new ListCache(entries);
        this.size = data.size;
    }

    clear() {
        this.__data__ = new ListCache;
        this.size = 0;
    }

    delete(key) {
        const data = this.__data__;
        const result = data['delete'](key);

        this.size = data.size;
        return result;
    }

    get(key) {
        return this.__data__.get(key);
    }

    has(key) {
        return this.__data__.has(key);
    }

    set(key, value) {
        let data = this.__data__;
        if (data instanceof ListCache) {
            const pairs = data.__data__;
            if (pairs.length < LARGE_ARRAY_SIZE - 1) {
                pairs.push([key, value]);
                this.size = ++data.size;
                return this;
            }
            data = this.__data__ = new MapCache(pairs);
        }
        data.set(key, value);
        this.size = data.size;
        return this;
    }
}

class ListCache {
    constructor(entries) {
        let index = -1;
        const length = entries == null ? 0 : entries.length;

        this.clear();
        while (++index < length) {
            const entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }

    clear() {
        this.__data__ = [];
        this.size = 0;
    }

    delete(key) {
        const data = this.__data__;
        const index = assocIndexOf(data, key);

        if (index < 0) {
            return false;
        }
        const lastIndex = data.length - 1;
        if (index == lastIndex) {
            data.pop();
        } else {
            data.splice(index, 1);
        }
        --this.size;
        return true;
    }

    get(key) {
        const data = this.__data__;
        const index = assocIndexOf(data, key);
        return index < 0 ? undefined : data[index][1];
    }

    has(key) {
        return assocIndexOf(this.__data__, key) > -1;
    }

    set(key, value) {
        const data = this.__data__;
        const index = assocIndexOf(data, key);

        if (index < 0) {
            ++this.size;
            data.push([key, value]);
        } else {
            data[index][1] = value;
        }
        return this;
    }
}

class MapCache {
    constructor(entries) {
        let index = -1;
        const length = entries == null ? 0 : entries.length;

        this.clear();
        while (++index < length) {
            const entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }

    clear() {
        this.size = 0;
        this.__data__ = {
            'hash': new Hash,
            'map': new Map,
            'string': new Hash
        };
    }

    delete(key) {
        const result = getMapData(this, key)['delete'](key);
        this.size -= result ? 1 : 0;
        return result;
    }

    get(key) {
        return getMapData(this, key).get(key);
    }

    has(key) {
        return getMapData(this, key).has(key);
    }

    set(key, value) {
        const data = getMapData(this, key);
        const size = data.size;

        data.set(key, value);
        this.size += data.size == size ? 0 : 1;
        return this;
    }
}

class Hash {
    constructor(entries) {
        let index = -1;
        const length = entries == null ? 0 : entries.length;

        this.clear();
        while (++index < length) {
            const entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }

    clear() {
        this.__data__ = Object.create(null);
        this.size = 0;
    }

    delete(key) {
        const result = this.has(key) && delete this.__data__[key];
        this.size -= result ? 1 : 0;
        return result;
    }

    get(key) {
        const data = this.__data__;
        const result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
    }

    has(key) {
        const data = this.__data__;
        return data[key] !== undefined;
    }

    set(key, value) {
        const data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = value === undefined ? HASH_UNDEFINED : value;
        return this;
    }
}

class SetCache {
    constructor(values) {
        let index = -1;
        const length = values == null ? 0 : values.length;

        this.__data__ = new MapCache;
        while (++index < length) {
            this.add(values[index]);
        }
    }

    add(value) {
        this.__data__.set(value, HASH_UNDEFINED);
        return this;
    }

    has(value) {
        return this.__data__.has(value);
    }
}

SetCache.prototype.push = SetCache.prototype.add;

// -- top level functions

export const isBoolean = function(value) {
    var toString = Object.prototype.toString;
    return value === true || value === false || (!!value && typeof value === 'object' && toString.call(value) === boolTag);
};

export const isObject = function(value) {
    return !!value && (typeof value === 'object' || typeof value === 'function');
};

export const isNumber = function(value) {
    var toString = Object.prototype.toString;
    return typeof value === 'number' || (!!value && typeof value === 'object' && toString.call(value) === numberTag);
};

export const isString = function(value) {
    var toString = Object.prototype.toString;
    return typeof value === 'string' || (!!value && typeof value === 'object' && toString.call(value) === stringTag);
};

export const assign = createAssigner((object, source) => {
    if (isPrototype(source) || isArrayLike(source)) {
        copyObject(source, keys(source), object);
        return;
    }
    for (var key in source) {
        if (hasOwnProperty.call(source, key)) {
            assignValue(object, key, source[key]);
        }
    }
});

export const mixin = assign;

export const deepMixin = mixin;

export const supplement = (object, ...sources) => {
    let index = -1;
    let length = sources.length;
    const guard = length > 2 ? sources[2] : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
        length = 1;
    }

    while (++index < length) {
        const source = sources[index];

        if (source == null) {
            continue;
        }

        const props = Object.keys(source);
        const propsLength = props.length;
        let propsIndex = -1;

        while (++propsIndex < propsLength) {
            const key = props[propsIndex];
            const value = object[key];

            if (value === undefined ||
                (eq(value, Object.prototype[key]) && !hasOwnProperty.call(object, key))) {
                object[key] = source[key];
            }
        }
    }

    return object;
};

export const defaults = supplement;

export const deepSupplement = function defaultsDeep(...args) {
    args.push(undefined, customDefaultsMerge);
    return merge.apply(undefined, args);
};

export const defaultsDeep = deepSupplement;

// _.invokeMap
export const invoke = (collection, path, ...args) => {
    let index = -1;
    const isFunc = typeof path === 'function';
    const result = isArrayLike(collection) ? new Array(collection.length) : [];

    baseEach(collection, (value) => {
        result[++index] = isFunc ? path.apply(value, args) : invokeProperty(value, path, ...args);
    });

    return result;
};

// _.invoke
export const invokeProperty = (object, path, ...args) => {
    path = castPath(path, object);
    object = parent(object, path);
    const func = object == null ? object : object[toKey(last(path))];
    return func == null ? undefined : func.apply(object, args);
};

export const sortedIndex = (array, value, iteratee) => {
    let low = 0;
    let high = array == null ? 0 : array.length;
    if (high == 0) {
        return 0;
    }

    iteratee = getIteratee(iteratee, 2);
    value = iteratee(value);

    const valIsNaN = value !== value;
    const valIsNull = value === null;
    const valIsSymbol = isSymbol(value);
    const valIsUndefined = value === undefined;

    while (low < high) {
        let setLow;
        const mid = Math.floor((low + high) / 2);
        const computed = iteratee(array[mid]);
        const othIsDefined = computed !== undefined;
        const othIsNull = computed === null;
        const othIsReflexive = computed === computed;
        const othIsSymbol = isSymbol(computed);

        if (valIsNaN) {
            setLow = othIsReflexive;
        } else if (valIsUndefined) {
            setLow = othIsReflexive &&othIsDefined;
        } else if (valIsNull) {
            setLow = othIsReflexive && othIsDefined && !othIsNull;
        } else if (valIsSymbol) {
            setLow = othIsReflexive && othIsDefined && !othIsNull && !othIsSymbol;
        } else if (othIsNull || othIsSymbol) {
            setLow = false;
        } else {
            setLow = computed < value;
        }
        if (setLow) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return Math.min(high, MAX_ARRAY_INDEX);
};

export const uniq = (array, iteratee) => {
    let index = -1;
    let includes = (array, value) => {
        const length = array == null ? 0 : array.length;
        return !!length && array.indexOf(value) > -1;
    };
    iteratee = getIteratee(iteratee, 2);
    let isCommon = true;

    const { length } = array;
    const result = [];
    let seen = result;

    if (length >= LARGE_ARRAY_SIZE) {
        const set = iteratee ? null : createSet(array);
        if (set) {
            return setToArray(set);
        }
        isCommon = false;
        includes = (cache, key) => cache.has(key);
        seen = new SetCache;
    } else {
        seen = iteratee ? [] : result;
    }
    outer:
    while (++index < length) {
        let value = array[index];
        const computed = iteratee ? iteratee(value) : value;

        value = (value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
            let seenIndex = seen.length;
            while (seenIndex--) {
                if (seen[seenIndex] === computed) {
                    continue outer;
                }
            }
            if (iteratee) {
                seen.push(computed);
            }
            result.push(value);
        }
        else if (!includes(seen, computed)) {
            if (seen !== result) {
                seen.push(computed);
            }
            result.push(value);
        }
    }
    return result;
};

export const clone = (value) => baseClone(value);

export const cloneDeep = (value) => baseClone(value, true);

export const isEmpty = (value) => {
    if (value == null) {
        return true;
    }
    if (isArrayLike(value) &&
        (Array.isArray(value) || typeof value === 'string' || typeof value.splice === 'function' ||
            isTypedArray(value) || isArguments(value))) {
        return !value.length;
    }
    const tag = getTag(value);
    if (tag == '[object Map]' || tag == '[object Set]') {
        return !value.size;
    }
    if (isPrototype(value)) {
        return !baseKeys(value).length;
    }
    for (const key in value) {
        if (hasOwnProperty.call(value, key)) {
            return false;
        }
    }
    return true;
};
export const isEqual = (object, other) => baseIsEqual(object, other);

export const isFunction = (value) => typeof value === 'function';

export const isPlainObject = (value) => {
    if (!isObjectLike(value) || getTag(value) != '[object Object]') {
        return false;
    }
    if (Object.getPrototypeOf(value) === null) {
        return true;
    }
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
};

export const toArray = (value) => {
    if (!value) {
        return [];
    }

    if (isArrayLike(value)) {
        return isString(value) ? stringToArray(value) : copyArray(value);
    }

    if (Symbol.iterator && Symbol.iterator in Object(value)) {
        const iterator = value[Symbol.iterator]();
        let data;
        const result = [];

        while (!(data = iterator.next()).done) {
            result.push(data.value);
        }
        return result;
    }

    const tag = getTag(value);
    const func = tag == mapTag ? mapToArray : (tag == setTag ? setToArray : values);

    return func(value);
};

export function debounce(func, wait, opt) {
    if (typeof func !== 'function') {
        throw new TypeError('Expected a function');
    }

    let lastArgs;
    let lastThis;
    let maxWait;
    let result;
    let timerId;
    let lastCallTime;
    let lastInvokeTime = 0;
    let leading = false;
    let maxing = false;
    let trailing = true;

    const useRaf = (!wait && wait !== 0 && window && typeof window.requestAnimationFrame === 'function');

    wait = +wait || 0;

    if (isObject(opt)) {
        leading = !!opt.leading;
        maxing = 'maxWait' in opt;
        maxWait = maxing ? Math.max(+opt.maxWait || 0, wait) : maxWait;
        trailing = 'trailing' in opt ? !!opt.trailing : trailing;
    }

    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }

    function startTimer(pendingFunc, wait) {
        if (useRaf) {
            window.cancelAnimationFrame(timerId);
            return window.requestAnimationFrame(pendingFunc);
        }
        return setTimeout(pendingFunc, wait);
    }

    function cancelTimer(id) {
        if (useRaf) {
            return window.cancelAnimationFrame(id);
        }
        clearTimeout(id);
    }

    function leadingEdge(time) {
        lastInvokeTime = time;
        timerId = startTimer(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (lastCallTime === undefined || (timeSinceLastCall >= wait) || (timeSinceLastCall < 0) ||
            (maxing && timeSinceLastInvoke >= maxWait));
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timerId = startTimer(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
        timerId = undefined;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }

    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timerId === undefined) {
                return leadingEdge(lastCallTime);
            }
            if (maxing) {
                timerId = startTimer(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait);
        }
        return result;
    }

    debounced.cancel = () => {
        if (timerId !== undefined) {
            cancelTimer(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
    };
    debounced.flush = () => timerId === undefined ? result : trailingEdge(Date.now());
    debounced.pending = () => timerId !== undefined;

    return debounced;
}

export const groupBy = (collection, iteratee) => {
    iteratee = getIteratee(iteratee, 2);

    return reduce(collection, (result, value, key) => {
        key = iteratee(value);
        if (hasOwnProperty.call(result, key)) {
            result[key].push(value);
        } else {
            assignValue(result, key, [value]);
        }
        return result;
    }, {});
};

export const sortBy = (collection, iteratees = []) => {
    if (collection == null) {
        return [];
    }

    const length = iteratees.length;
    if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
        iteratees = [];
    } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
        iteratees = [iteratees[0]];
    }

    if (!Array.isArray(iteratees)) {
        iteratees = [getIteratee(iteratees, 2)];
    }

    return baseOrderBy(collection, iteratees.flat(1), []);
};

export const flattenDeep = (array) => {
    const length = array == null ? 0 : array.length;
    return length ? baseFlatten(array, Infinity) : [];
};

export const without = (array, ...values) => isArrayLike(array) ? diff(array, values) : [];

export const difference = (array, ...values) =>
    isObjectLike(array) && isArrayLike(array) ?
        diff(array, values.flat(1)) : [];

export const intersection = (...arrays) => {
    const mapped = arrays.map((array) =>
        isObjectLike(array) && isArrayLike(array) ?
            array : []
    );

    return mapped.length && mapped[0] === arrays[0] ?
        intersect(mapped) : [];
};

export const union = (...arrays) => {
    const array = arrays.flat(1);
    return uniq(array);
};

export const has = (object, key) => {
    if (object == null) {
        return false;
    }

    if (typeof key === 'string') {
        key = key.split('.');
    }

    let index = -1;
    let value = object;

    while (++index < key.length) {
        if (!value || !hasOwnProperty.call(value, key[index])) {
            return false;
        }
        value = value[key[index]];
    }

    return true;
};

export const result = (object, path, defaultValue) => {
    path = castPath(path, object);

    let index = -1;
    let length = path.length;

    if (!length) {
        length = 1;
        object = undefined;
    }
    while (++index < length) {
        let value = object == null ? undefined : object[toKey(path[index])];
        if (value === undefined) {
            index = length;
            value = defaultValue;
        }
        object = typeof value === 'function' ? value.call(object) : value;
    }
    return object;
};

export const omit = (object, ...paths) => {
    let result = {};
    if (object == null) {
        return result;
    }
    let isDeep = false;
    paths = paths.flat(1).map((path) => {
        path = castPath(path, object);
        isDeep || (isDeep = path.length > 1);
        return path;
    });
    copyObject(object, getAllKeysIn(object), result);
    if (isDeep) {
        result = baseClone(result, true, true, true, (value) => isPlainObject(value) ? undefined : value);
    }
    let length = paths.length;
    while (length--) {
        unset(result, paths[length]);
    }
    return result;
};

export const pick = (object, ...paths) => {
    return object == null ? {} : basePick(object, paths.flat(Infinity));
};

export const bindAll = (object, ...methodNames) => {
    methodNames.flat(1).forEach((key) => {
        key = toKey(key);
        assignValue(object, key, object[key].bind(object));
    });
    return object;
};

export const forIn = (object, iteratee = (value) => value) => {
    let index = -1;
    const iterable = Object(object);
    const props = isArrayLike(object) ? arrayLikeKeys(object, true) : keysIn(object);
    let length = props.length;

    while(length--) {
        const key = props[++index];
        if (iteratee(iterable[key], key, iterable) === false) {
            break;
        }
    }
};

export const camelCase = (string = '') => (
    words(`${string}`.replace(/['\u2019]/g, ''))
        .reduce((result, word, index) => {
            word = word.toLowerCase();
            return result + (index ? upperFirst(word) : word);
        }, '')
);

let idCounter = 0;

export const uniqueId = (prefix = '') => {
    const id = ++idCounter;
    return `${prefix}` + id;
};

export const merge = createAssigner((object, source, srcIndex, customizer) => {
    baseMerge(object, source, srcIndex, customizer);
}, true);
