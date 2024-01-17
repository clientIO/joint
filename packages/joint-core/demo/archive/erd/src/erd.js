const Entity = joint.dia.Element.define('erd.Entity', {
    size: { width: 150, height: 60 },
    attrs: {
        '.outer': {
            fill: '#2ECC71', stroke: '#27AE60', 'stroke-width': 2,
            points: '100,0 100,60 0,60 0,0'
        },
        '.inner': {
            fill: '#2ECC71', stroke: '#27AE60', 'stroke-width': 2,
            points: '95,5 95,55 5,55 5,5',
            display: 'none'
        },
        text: {
            text: 'Entity',
            'font-family': 'Arial', 'font-size': 14,
            'ref-x': .5, 'ref-y': .5,
            'y-alignment': 'middle', 'text-anchor': 'middle'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text/></g>',
    useCSSSelectors: true
});

const WeakEntity = Entity.define('erd.WeakEntity', {
    attrs: {
        '.inner': { display: 'auto' },
        text: { text: 'Weak Entity' }
    }
});

const Relationship = joint.dia.Element.define('erd.Relationship', {
    size: { width: 80, height: 80 },
    attrs: {
        '.outer': {
            fill: '#3498DB', stroke: '#2980B9', 'stroke-width': 2,
            points: '40,0 80,40 40,80 0,40'
        },
        '.inner': {
            fill: '#3498DB', stroke: '#2980B9', 'stroke-width': 2,
            points: '40,5 75,40 40,75 5,40',
            display: 'none'
        },
        text: {
            text: 'Relationship',
            'font-family': 'Arial', 'font-size': 12,
            'ref-x': .5, 'ref-y': .5,
            'y-alignment': 'middle', 'text-anchor': 'middle'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text/></g>',
    useCSSSelectors: true
});

const IdentifyingRelationship = Relationship.define('erd.IdentifyingRelationship', {
    attrs: {
        '.inner': { display: 'auto' },
        text: { text: 'Identifying' }
    }
});

const Attribute = joint.dia.Element.define('erd.Attribute', {
    size: { width: 100, height: 50 },
    attrs: {
        'ellipse': {
            transform: 'translate(50, 25)'
        },
        '.outer': {
            stroke: '#D35400', 'stroke-width': 2,
            cx: 0, cy: 0, rx: 50, ry: 25,
            fill: '#E67E22'
        },
        '.inner': {
            stroke: '#D35400', 'stroke-width': 2,
            cx: 0, cy: 0, rx: 45, ry: 20,
            fill: '#E67E22', display: 'none'
        },
        text: {
            'font-family': 'Arial', 'font-size': 14,
            'ref-x': .5, 'ref-y': .5,
            'y-alignment': 'middle', 'text-anchor': 'middle'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><ellipse class="outer"/><ellipse class="inner"/></g><text/></g>',
    useCSSSelectors: true
});

const Multivalued = Attribute.define('erd.Multivalued', {
    attrs: {
        '.inner': { display: 'block' },
        text: { text: 'multivalued' }
    }
});

const Derived = Attribute.define('erd.Derived', {
    attrs: {
        '.outer': { 'stroke-dasharray': '3,5' },
        text: { text: 'derived' }
    }
});

const Key = Attribute.define('erd.Key', {
    attrs: {
        ellipse: { 'stroke-width': 4 },
        text: { text: 'key', 'font-weight': '800', 'text-decoration': 'underline' }
    }
});

const Normal = Attribute.define('erd.Normal', {
    attrs: { text: { text: 'Normal' }}
});

const ISA = joint.dia.Element.define('erd.ISA', {
    type: 'erd.ISA',
    size: { width: 100, height: 50 },
    attrs: {
        polygon: {
            points: '0,0 50,50 100,0',
            fill: '#F1C40F', stroke: '#F39C12', 'stroke-width': 2
        },
        text: {
            text: 'ISA', 'font-size': 18,
            'ref-x': .5, 'ref-y': .3,
            'y-alignment': 'middle', 'text-anchor': 'middle'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polygon/></g><text/></g>',
    useCSSSelectors: true
});

const Line = joint.dia.Link.define('erd.Line', {}, {
    useCSSSelectors: true,
    cardinality: function(value) {
        this.set('labels', [{ position: -20, attrs: { text: { dy: -8, text: value }}}]);
    }
});

const shapes = {
    ...joint.shapes,
    erd: {
        Entity,
        WeakEntity,
        Relationship,
        IdentifyingRelationship,
        Attribute,
        Multivalued,
        Derived,
        Key,
        Normal,
        ISA,
        Line
    }
};

var erd = joint.shapes.erd;

var graph = new joint.dia.Graph({}, { cellNamespace: shapes });

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 695,
    height: 600,
    model: graph,
    cellViewNamespace: shapes,
    linkPinning: false,
    highlighting: false,
    linkView: joint.dia.LegacyLinkView,
    defaultConnectionPoint: function(line, view) {
        var element = view.model;
        return element.getConnectionPoint(line.start) || element.getBBox().center();
    }
});

// Custom highlighter - display an outline around each element that fits its shape.

var highlighter = V('path', {
    'stroke': '#e9fc03',
    'stroke-width': '2px',
    'fill': 'transparent',
    'pointer-events': 'none'
});

// Define a specific highlighting path for every shape.

erd.Attribute.prototype.getHighlighterPath = function(w, h) {

    return ['M', 0, h / 2, 'A', w / 2, h / 2, '0 1,0', w, h / 2, 'A', w / 2, h / 2, '0 1,0', 0, h / 2].join(' ');
};

erd.Entity.prototype.getHighlighterPath = function(w, h) {

    return ['M', w, 0, w, h, 0, h, 0, 0, 'z'].join(' ');
};

erd.Relationship.prototype.getHighlighterPath = function(w, h) {

    return ['M', w / 2, 0, w, w / 2, w / 2, w, 0, w / 2, 'z'].join(' ');
};

erd.ISA.prototype.getHighlighterPath = function(w, h) {

    return ['M', -8, 1, w + 8, 1, w / 2, h + 2, 'z'].join(' ');
};

// Define a specific connection points for every shape

erd.Attribute.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with an ellipse
    return g.Ellipse.fromRect(this.getBBox()).intersectionWithLineFromCenterToPoint(referencePoint);
};

erd.Entity.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with a rectangle
    return this.getBBox().intersectionWithLineFromCenterToPoint(referencePoint);
};

erd.Relationship.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with a rhomb
    var bbox = this.getBBox();
    var line = new g.Line(bbox.center(), referencePoint);
    return (
        line.intersection(new g.Line(bbox.topMiddle(), bbox.leftMiddle())) ||
        line.intersection(new g.Line(bbox.leftMiddle(), bbox.bottomMiddle())) ||
        line.intersection(new g.Line(bbox.bottomMiddle(), bbox.rightMiddle())) ||
        line.intersection(new g.Line(bbox.rightMiddle(), bbox.topMiddle()))
    );
};

erd.ISA.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with a triangle
    var bbox = this.getBBox();
    var line = new g.Line(bbox.center(), referencePoint);
    return (
        line.intersection(new g.Line(bbox.origin(), bbox.topRight())) ||
        line.intersection(new g.Line(bbox.origin(), bbox.bottomMiddle())) ||
        line.intersection(new g.Line(bbox.topRight(), bbox.bottomMiddle()))
    );
};

// Bind custom ones.
paper.on('cell:highlight', function(cellView) {

    var padding = 5;
    var bbox = cellView.getBBox({ useModelGeometry: true }).inflate(padding);

    highlighter.translate(bbox.x, bbox.y, { absolute: true });
    highlighter.attr('d', cellView.model.getHighlighterPath(bbox.width, bbox.height));

    V(paper.viewport).append(highlighter);
});

paper.on('cell:unhighlight', function() {

    highlighter.remove();
});

// Create shapes

var employee = new erd.Entity({

    position: { x: 100, y: 200 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Employee',
            letterSpacing: 0,
            style: { textShadow: '1px 0 1px #333333' }
        },
        '.outer': {
            fill: '#31d0c6',
            stroke: 'none',
            filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
        },
        '.inner': {
            fill: '#31d0c6',
            stroke: 'none',
            filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
        }
    }
});

var wage = new erd.WeakEntity({

    position: { x: 530, y: 200 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Wage',
            letterSpacing: 0,
            style: { textShadow: '1px 0 1px #333333' }
        },
        '.inner': {
            fill: '#31d0c6',
            stroke: 'none',
            points: '155,5 155,55 5,55 5,5'
        },
        '.outer': {
            fill: 'none',
            stroke: '#31d0c6',
            points: '160,0 160,60 0,60 0,0',
            filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
        }
    }
});

var paid = new erd.IdentifyingRelationship({

    position: { x: 350, y: 190 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Gets paid',
            letterSpacing: 0,
            style: { textShadow: '1px 0 1px #333333' }
        },
        '.inner': {
            fill: '#7c68fd',
            stroke: 'none'
        },
        '.outer': {
            fill: 'none',
            stroke: '#7c68fd',
            filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 1, color: '#333333' }}
        }
    }
});

var isa = new erd.ISA({

    position: { x: 125, y: 300 },
    attrs: {
        text: {
            text: 'ISA',
            fill: '#ffffff',
            letterSpacing: 0,
            style: { 'text-shadow': '1px 0 1px #333333' }
        },
        polygon: {
            fill: '#fdb664',
            stroke: 'none',
            filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 1, color: '#333333' }}
        }
    }
});

var number = new erd.Key({

    position: { x: 10, y: 90 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Number',
            letterSpacing: 0,
            style: { textShadow: '1px 0 1px #333333' }
        },
        '.outer': {
            fill: '#feb662',
            stroke: 'none',
            filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#222138' }}
        },
        '.inner': {
            fill: '#feb662',
            stroke: 'none'
        }
    }
});

var employeeName = new erd.Normal({

    position: { x: 75, y: 30 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Name',
            letterSpacing: 0,
            style: { textShadow: '1px 0 1px #333333' }
        },
        '.outer': {
            fill: '#fe8550',
            stroke: '#fe854f',
            filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#222138' }}
        }
    }
});

var skills = new erd.Multivalued({

    position: { x: 150, y: 90 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Skills',
            letterSpacing: 0,
            style: { 'text-shadow': '1px 0px 1px #333333' }
        },
        '.inner': {
            fill: '#fe8550',
            stroke: 'none',
            rx: 43,
            ry: 21

        },
        '.outer': {
            fill: '#464a65',
            stroke: '#fe8550',
            filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#222138' }}
        }
    }
});

var amount = new erd.Derived({

    position: { x: 440, y: 80 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Amount',
            letterSpacing: 0,
            style: { textShadow: '1px 0 1px #333333' }
        },
        '.inner': {
            fill: '#fca079',
            stroke: 'none',
            display: 'block'
        },
        '.outer': {
            fill: '#464a65',
            stroke: '#fe854f',
            'stroke-dasharray': '3,1',
            filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#222138' }}
        }
    }
});

var uses = new erd.Relationship({

    position: { x: 300, y: 390 },
    attrs: {
        text: {
            fill: '#ffffff',
            text: 'Uses',
            letterSpacing: 0,
            style: { textShadow: '1px 0 1px #333333' }
        },
        '.outer': {
            fill: '#797d9a',
            stroke: 'none',
            filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 1, color: '#333333' }}
        }
    }
});

// Create new shapes by cloning

var salesman = employee.clone().translate(0, 200).attr('text/text', 'Salesman');

var date = employeeName.clone().position(585, 80).attr('text/text', 'Date');

var car = employee.clone().position(430, 400).attr('text/text', 'Company car');

var plate = number.clone().position(405, 500).attr('text/text', 'Plate');


// Helpers

var createLink = function(elm1, elm2) {

    var myLink = new erd.Line({
        markup: [
            '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
            '<path class="connection-wrap" d="M 0 0 0 0"/>',
            '<g class="labels"/>',
            '<g class="marker-vertices"/>',
            '<g class="marker-arrowheads"/>'
        ].join(''),
        source: { id: elm1.id },
        target: { id: elm2.id }
    });

    return myLink.addTo(graph);
};

var createLabel = function(txt) {
    return {
        labels: [{
            position: -20,
            attrs: {
                text: { dy: -8, text: txt, fill: '#ffffff' },
                rect: { fill: 'none' }
            }
        }]
    };
};

// Add shapes to the graph

graph.addCells([employee, salesman, wage, paid, isa, number, employeeName, skills, amount, date, plate, car, uses]);

createLink(employee, paid).set(createLabel('1'));
createLink(employee, number);
createLink(employee, employeeName);
createLink(employee, skills);
createLink(employee, isa);
createLink(isa, salesman);
createLink(salesman, uses).set(createLabel('0..1'));
createLink(car, uses).set(createLabel('1..1'));
createLink(car, plate);
createLink(wage, paid).set(createLabel('N'));
createLink(wage, amount);
createLink(wage, date);
