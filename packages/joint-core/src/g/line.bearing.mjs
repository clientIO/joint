// @return the bearing (cardinal direction) of the line. For example N, W, or SE.
// @returns {String} One of the following bearings : NE, E, SE, S, SW, W, NW, N.
import { toDeg, toRad } from './geometry.helpers.mjs';

const {
    cos,
    sin,
    atan2
} = Math;

export const bearing = function(p, q) {

    var lat1 = toRad(p.y);
    var lat2 = toRad(q.y);
    var lon1 = p.x;
    var lon2 = q.x;
    var dLon = toRad(lon2 - lon1);
    var y = sin(dLon) * cos(lat2);
    var x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon);
    var brng = toDeg(atan2(y, x));

    var bearings = ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

    var index = brng - 22.5;
    if (index < 0)
        index += 360;
    index = parseInt(index / 45);

    return bearings[index];
};
