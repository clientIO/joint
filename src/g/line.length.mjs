import { squaredLength } from './line.squaredLength.mjs';

export const length = function(start, end) {
    return Math.sqrt(squaredLength(start, end));
};
