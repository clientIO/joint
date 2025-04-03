'use strict';

const { expect } = require('chai');
const joint = require('../../build/joint');

describe('Sanity check', () => {
    describe('require', () => {
        it('should return a non-empty object', () => {
            expect(joint).to.be.an('object');
            expect(joint).to.not.be.empty;
        });

        it('should contain Graph constructor', () => {
            expect(joint).to.exist;
            expect(joint.dia).to.exist;
            expect(joint.dia.Graph).to.exist;
            expect(joint.dia.Graph).to.be.a('function');
        });
    });
});

describe('Graph', () => {
    describe('#addCell()', () => {
        it('should add a cell to the graph cells collection', () => {
            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const cell = new joint.shapes.standard.Rectangle({ 
                attrs: { label: { fill: 'yellow' } }
            });
            
            graph.addCell(cell);
            
            expect(graph.get('cells')).to.have.lengthOf(1);
            expect(graph.get('cells').at(0)).to.be.an.instanceOf(joint.shapes.standard.Rectangle);
        });
    });

    describe('events', () => {
        it('should trigger add event when new cell has been added', () => {
            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const cell = new joint.shapes.standard.Rectangle({ 
                attrs: { label: { fill: 'yellow' } }
            });
            let eventTriggered = false;
            
            graph.on('add', () => { eventTriggered = true; });
            graph.addCell(cell);
            
            expect(eventTriggered).to.be.true;
        });
    });
});
