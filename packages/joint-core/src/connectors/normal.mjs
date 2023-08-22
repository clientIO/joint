import { straight } from './straight.mjs';

export const normal = function(sourcePoint, targetPoint, route = [], opt = {}) {

    const { raw } = opt;
    const localOpt = {
        cornerType: 'point',
        raw
    };

    return straight(sourcePoint, targetPoint, route, localOpt);
};
