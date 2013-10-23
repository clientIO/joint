var should = require('should');

var joint = require('../../index');

describe('Sanity check', function() {

    describe('require', function() {

        
        it('should return an object', function() {
            joint.should.have.type('object');
            joint.should.not.be.empty;
        });

        it('should contain Graph constructor', function() {

            joint.should.have.property('dia');
            joint.dia.should.have.property('Graph');
            joint.dia.Graph.should.have.type('function');
        });
    });
});


describe('Graph', function() {

    describe('#addCell()', function() {

        it('should add a cell to the graph cells collection', function() {

            var g = new joint.dia.Graph;
            var c = new joint.shapes.basic.Rect({ attrs: { text: { fill: 'yellow' } }});
            g.addCell(c);
            g.get('cells').length.should.be.exactly(1);
            g.get('cells').at(0).should.be.an.instanceOf(joint.shapes.basic.Rect);
        });
    });

    describe('events', function() {

        it('should trigger add event when new cell has been added', function() {

            var g = new joint.dia.Graph;
            var c = new joint.shapes.basic.Rect({ attrs: { text: { fill: 'yellow' } }});
            var called = false;
            g.on('add', function() { called = true; });
            g.addCell(c);
            called.should.be.true;
        });
    });
});



describe('shapes', function() {

    describe('basic', function() {
        it('should contain all the shapes', function() {
            
            ['Rect', 'Text', 'Circle', 'Image', 'Path'].forEach(function(type) {
                (new joint.shapes.basic[type]()).should.not.be.empty;
            });
        });
    });

    describe('erd', function() {
        it('should contain all the shapes', function() {
            
            ['Entity', 'WeakEntity', 'Relationship', 'IdentifyingRelationship', 'Attribute', 'Multivalued', 'Derived', 'Key', 'Normal', 'ISA', 'Line'].forEach(function(type) {
                (new joint.shapes.erd[type]()).should.not.be.empty;
            });
        });
    });

    describe('pn', function() {
        it('should contain all the shapes', function() {
            
            ['Place', 'Transition', 'Link'].forEach(function(type) {
                (new joint.shapes.pn[type]()).should.not.be.empty;
            });
        });
    });

    describe('fsa', function() {
        it('should contain all the shapes', function() {
            
            ['State', 'StartState', 'EndState', 'Arrow'].forEach(function(type) {
                (new joint.shapes.fsa[type]()).should.not.be.empty;
            });
        });
    });

    describe('uml', function() {
        it('should contain all the shapes', function() {
            
            ['Class', 'Abstract', 'Interface', 'Generalization', 'Aggregation', 'Composition', 'Association', 'State', 'StartState', 'EndState', 'Transition'].forEach(function(type) {
                (new joint.shapes.uml[type]()).should.not.be.empty;
            });
        });
    });

    describe('devs', function() {
        it('should contain all the shapes', function() {
            
            ['Model', 'Atomic', 'Coupled', 'Link'].forEach(function(type) {
                (new joint.shapes.devs[type]()).should.not.be.empty;
            });
        });
    });

    describe('org', function() {
        it('should contain all the shapes', function() {
            
            ['Member', 'Arrow'].forEach(function(type) {
                (new joint.shapes.org[type]()).should.not.be.empty;
            });
        });
    });
});
