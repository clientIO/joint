// @return {object} a plain object with the six fields of a transformation matrix (`a`, `b`, `c`, `d`, `e`, `f`);
// the fields missing in `matrix` are the ones of the identity matrix
// @perf reading a field of a matrix of the DOM is slow: read the fields once and pass the result on
export const toPlainMatrix = function(matrix) {

    const { a = 1, b = 0, c = 0, d = 1, e = 0, f = 0 } = matrix;
    return { a, b, c, d, e, f };
};
