// Declare shorthands to the most used math functions.
const {
    round,
    floor,
    PI
} = Math;

export const scale = {

    // Return the `value` from the `domain` interval scaled to the `range` interval.
    linear: function(domain, range, value) {

        var domainSpan = domain[1] - domain[0];
        var rangeSpan = range[1] - range[0];
        return (((value - domain[0]) / domainSpan) * rangeSpan + range[0]) || 0;
    }
};

export const normalizeAngle = function(angle) {

    return (angle % 360) + (angle < 0 ? 360 : 0);
};

export const snapToGrid = function(value, gridSize) {

    return gridSize * round(value / gridSize);
};

export const toDeg = function(rad) {

    return (180 * rad / PI) % 360;
};

export const toRad = function(deg, over360) {

    over360 = over360 || false;
    deg = over360 ? deg : (deg % 360);
    return deg * PI / 180;
};

// Return a random integer from the interval [min,max], inclusive.
export const random = function(min, max) {

    if (max === undefined) {
        // use first argument as max, min is 0
        max = (min === undefined) ? 1 : min;
        min = 0;

    } else if (max < min) {
        // switch max and min
        const temp = min;
        min = max;
        max = temp;
    }

    return floor((Math.random() * (max - min + 1)) + min);
};

