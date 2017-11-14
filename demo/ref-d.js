var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 400,
    gridSize: 10,
    model: graph
});

var Path = joint.shapes.basic.Generic.define('custom.Path', {
    // default attributes

    attrs: {
        path: {
            ref: '.r1',
            refX: 0,
            refY: 0,
        },
        '.r1': {
            refX: '50%',
            refY: '50%',
            width: 100,
            height: 200
        },
        '.r2': {
            refWidth: '100%',
            refHeight: '100%'
        }
    }
}, {
    // instance properties

    markup: '<g class="rotatable"><rect class="r2"/><rect class="r1"/><path/></g>', // no scalable group

    // Set model position and size based on calculated path bbox
    resetModel: function() {

        var d = this.attr('path/refD') || this.attr('path/refDKeepOffset') || this.attr('path/refDResetOffset');
        var modelBBox = g.Path(V.normalizePathData(d)).bbox();

        this.position(modelBBox.x, modelBBox.y);
        this.size(modelBBox.width, modelBBox.height);
    }
}, {
    // object properties

    // Take a path data string
    // Return a new instance of Path with correct model position and size
    createFromPathData: function(d) {
        // creates model based on provided d
        // does not trigger change:attrs

        var m = new this({
            attrs: { path: { refD: d }}
        });

        m.resetModel();

        return m;
    }
});

var d = 'M285.8,83V52.7h8.3v31c0,3.2-1,5.8-3,7.7c-2,1.9-4.4,2.8-7.2,2.8c-2.9,0-5.6-1.2-8.1-3.5l3.8-6.1c1.1,1.3,2.3,1.9,3.7,1.9c0.7,0,1.3-0.3,1.8-0.9C285.5,85,285.8,84.2,285.8,83z';

var path = Path.createFromPathData(d).attr({
    path: {
        fill: 'transparent',
        stroke: 'blue',
        strokeWidth: 1
    },
    '.r1': {
        fill: 'transparent',
        stroke: 'red',
        strokeWidth: 1
    },
    '.r2': {
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 1
    }
});

path.addTo(graph);
