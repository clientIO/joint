import { Point } from '../../g/index.mjs';

function atConnectionWrapper(method, opt) {
    var zeroVector = new Point(1, 0);
    return function(value) {
        var p, angle;
        var tangent = this[method](value);
        if (tangent) {
            angle = (opt.rotate) ? tangent.vector().vectorAngle(zeroVector) : 0;
            p = tangent.start;
        } else {
            p = this.path.start;
            angle = 0;
        }
        if (angle === 0) return { transform: 'translate(' + p.x + ',' + p.y + ')' };
        return { transform: 'translate(' + p.x + ',' + p.y + ') rotate(' + angle + ')' };
    };
}

function isLinkView() {
    return this.model.isLink();
}

const connectionAttributesNS = {

    'connection': {
        qualify: isLinkView,
        set: function({ stubs = 0 }) {
            let d;
            if (isFinite(stubs) && stubs !== 0) {
                let offset;
                if (stubs < 0) {
                    offset = (this.getConnectionLength() + stubs) / 2;
                } else {
                    offset = stubs;
                }
                const path = this.getConnection();
                const segmentSubdivisions = this.getConnectionSubdivisions();
                const sourceParts = path.divideAtLength(offset, { segmentSubdivisions });
                const targetParts = path.divideAtLength(-offset, { segmentSubdivisions });
                if (sourceParts && targetParts) {
                    d = `${sourceParts[0].serialize()} ${targetParts[1].serialize()}`;
                }
            }

            return { d: d || this.getSerializedConnection() };
        }
    },

    'at-connection-length-keep-gradient': {
        qualify: isLinkView,
        set: atConnectionWrapper('getTangentAtLength', { rotate: true })
    },

    'at-connection-length-ignore-gradient': {
        qualify: isLinkView,
        set: atConnectionWrapper('getTangentAtLength', { rotate: false })
    },

    'at-connection-ratio-keep-gradient': {
        qualify: isLinkView,
        set: atConnectionWrapper('getTangentAtRatio', { rotate: true })
    },

    'at-connection-ratio-ignore-gradient': {
        qualify: isLinkView,
        set: atConnectionWrapper('getTangentAtRatio', { rotate: false })
    }

};

connectionAttributesNS['at-connection-length'] = connectionAttributesNS['at-connection-length-keep-gradient'];
connectionAttributesNS['at-connection-ratio'] = connectionAttributesNS['at-connection-ratio-keep-gradient'];

export default connectionAttributesNS;
