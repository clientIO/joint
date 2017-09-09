Number.isFinite = Number.isFinite || function(value) {
    return typeof value === 'number' && isFinite(value);
};

//The following works because NaN is the only value in javascript which is not equal to itself.
Number.isNaN = Number.isNaN || function(value) {
    return value !== value;
}

