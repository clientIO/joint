import { straight } from './straight.mjs';

const CORNER_RADIUS = 10;
const PRECISION = 0;

export const rounded = function(sourcePoint, targetPoint, route = [], opt = {}) {

    const { radius = CORNER_RADIUS, raw } = opt;
    const localOpt = {
        cornerType: 'cubic',
        cornerRadius: radius,
        precision: PRECISION,
        raw
    };

    return straight(sourcePoint, targetPoint, route, localOpt);
};
