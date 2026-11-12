// Internal helpers of the methods that take a transformation matrix.
// Every such method reads the matrix with `toPlainMatrix()` first; the points are transformed with `transformPoint()`.

// @return {object} a plain object with the six fields of a transformation matrix (`a`, `b`, `c`, `d`, `e`, `f`);
// the fields missing in `matrix` are the ones of the identity matrix
// @perf reading a field of a matrix of the DOM is slow: the fields are read once here
export const toPlainMatrix = function(matrix) {

    const { a = 1, b = 0, c = 0, d = 1, e = 0, f = 0 } = matrix;
    return { a, b, c, d, e, f };
};

// Applies a plain matrix (see `toPlainMatrix()`) to a point. The point is changed.
export const transformPoint = function(point, plainMatrix) {

    const { a, b, c, d, e, f } = plainMatrix;
    const { x, y } = point;
    point.x = a * x + c * y + e;
    point.y = b * x + d * y + f;
};
