// @return {integer} length without sqrt
// @note for applications where the exact length is not necessary (e.g. compare only)
export const squaredLength = function(start, end) {

    var x0 = start.x;
    var y0 = start.y;
    var x1 = end.x;
    var y1 = end.y;
    return (x0 -= x1) * x0 + (y0 -= y1) * y0;
};
