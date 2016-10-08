var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 695,
    height: 600,
    gridSize: 1,
    model: graph,
    linkPinning: false,
    linkConnectionPoint: joint.util.shapePerimeterConnectionPoint,
    clickThreshold: 5,
    restrictTranslate: function(cellView) {

        var model = cellView.model;

        if (model.get('type') === 'groups.Port' && model.inEditMode()) {
            var container = _.find(model.group.getCells(), function(cell) {
                return cell.get('type') === 'groups.Container';
            });
            if (container) {
                return container.getBBox().expand(10);
            }
        }

        return null;
    }
});

var groupShapes = joint.shapes.groups = {};

groupShapes.Container = joint.shapes.basic.Generic.extend({
    markup: '<g class="rotatable"><rect/></g>',
    defaults: _.defaultsDeep({
        type: 'groups.Container',
        size: {
            width: 100,
            height: 100
        },
        editMode: false,
        attrs: {
            '.': {
                'magnet': false
            },
            'rect': {
                'ref-width': '100%',
                'ref-height': '100%',
                'rx': 5,
                'ry': 5,
                'fill': 'white',
                'stroke': 'gray',
                'stroke-width': '2',
                'cursor': 'move'
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults),

    toggleEditMode: function() {
        var editMode = this.inEditMode();
        return this.prop({
            editMode: !editMode,
            attrs: {
                rect: {
                    cursor: (editMode) ? 'move' : 'cell'
                }
            }
        });
    },

    inEditMode: function() {
        return this.get('editMode');
    }

}, {

    createAt: function(x, y) {
        return (new this).position(x, y);
    }
});

groupShapes.Port = joint.shapes.basic.Generic.extend({
    markup: '<g class="rotatable"><rect/></g>',
    defaults: _.defaultsDeep({
        type: 'groups.Port',
        size: {
            width: 20,
            height: 20
        },
        editMode: false,
        attrs: {
            '.': {
                'magnet': false
            },
            rect: {
                'ref-width': '100%',
                'ref-height': '100%',
                'rx': '10%',
                'ry': '10%',
                'fill': 'lightgray',
                'stroke': 'gray',
                'stroke-width': '2',
                'magnet': true,
                'cursor': '-webkit-grab'
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults),

    toggleEditMode: function() {
        var editMode = this.inEditMode();
        return this.prop({
            editMode: !editMode,
            attrs: {
                rect: (editMode)
                    ? { magnet: true, fill: 'lightgray' }
                    : { magnet: 'passive', fill: '#FF4136' }
            }
        });
    },

    inEditMode: function() {
        return this.get('editMode');
    }

}, {

    createAt: function(x, y) {
        var defaultSize = this.prototype.defaults.size;
        return (new this).position(
            x - defaultSize.width / 2,
            y - defaultSize.height / 2
        );
    }
});

var g1 = (new joint.dia.Group({
    cells: [
        groupShapes.Container.createAt(0,0),
        groupShapes.Port.createAt(0, 50),
        groupShapes.Port.createAt(100, 50),
        groupShapes.Port.createAt(50, 0)
    ]
})).translate(100,100).addTo(graph);

var g2 = g1.clone().translate(200,200).addTo(graph);

var editHighlighter = {
    name: 'stroke',
    options: {
        padding: 24,
        rx: 5,
        ry: 5,
        attrs: {
            'stroke-width': 2,
            'stroke-dasharray': '5,1',
            'stroke': '#FF4136'
        }
    }
};

var clickTimerId;
var clickViewCid;

paper.on('cell:pointerclick', function(view, evt, x, y) {

    if (clickTimerId && clickViewCid === view.cid) {
        // double click
        window.clearTimeout(clickTimerId);
        clickTimerId = null;
        clickViewCid = null;
        dblClick(view, evt, x, y);

    } else {
        // single click
        clickViewCid = view.cid;
        clickTimerId = window.setTimeout(function() {
            clickTimerId = null;
            clickViewCid = null;
            click(view, evt, x, y);
        }, 300);
    }
});

function click(cellView, evt, x, y) {

    var model = cellView.model;
    var group = model.group;
    var editMode = model.inEditMode();

    switch (model.get('type')) {
        case 'groups.Container':
            if (editMode) {
                group.addCell(
                    groupShapes.Port.createAt(x, y)
                        .toggleEditMode()
                        .set('group', group)
                        .addTo(graph)
                );
            }
            break;
    }
}

function dblClick(cellView) {

    var model = cellView.model;
    var group = model.group;
    var editMode = model.inEditMode();

    switch (model.get('type')) {
        case 'groups.Container':

            if (editMode) {

                cellView
                    .setInteractivity(true)
                    .unhighlight(
                        cellView.el.querySelector('rect'),
                        { highlighter: editHighlighter }
                    );

                graph.addGroup(group);

            } else {

                cellView
                    .setInteractivity(false)
                    .highlight(
                        cellView.el.querySelector('rect'),
                        { highlighter: editHighlighter }
                    );

                graph.removeGroup(group);
            }

            _.invoke(group.getCells(), 'toggleEditMode');

            break;
        case 'groups.Port':

            if (editMode) {
                model.remove();
            }

            break;
    }
}
