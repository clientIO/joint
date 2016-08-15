'use strict';

QUnit.module('devs.shapes plugin', function(hooks) {

    var atomic;
    var coupled;

    hooks.beforeEach(function() {

        atomic = new joint.shapes.devs.Atomic({

            inPorts: ['xy'],
            outPorts: ['x', 'y']
        });

        coupled = new joint.shapes.devs.Coupled();
    });

    QUnit.module('devs.Model operations', function() {

        QUnit.test('addOutPort', function(assert) {

            coupled.addOutPort('out 1').addOutPort('out 2');

            assert.equal(coupled.getPorts().length, 2);
            assert.equal(coupled.getPorts()[0].id, 'out 1');
            assert.deepEqual(coupled.get('inPorts'), []);
            assert.deepEqual(coupled.get('outPorts'), ['out 1', 'out 2']);
        });

        QUnit.test('addInPort', function(assert) {

            atomic.addInPort('in 1').addInPort('in 2');

            assert.equal(atomic.getPorts().length, 5);
            assert.equal(atomic.getPorts()[1].id, 'in 1');
            assert.deepEqual(atomic.get('inPorts'), ['xy', 'in 1', 'in 2']);
            assert.deepEqual(atomic.get('outPorts'), ['x', 'y']);
        });

        QUnit.test('removeOutPort', function(assert) {

            var outPorts = _.clone(atomic.get('outPorts'));
            var inPorts = _.clone(atomic.get('inPorts'));

            atomic.removeOutPort(outPorts.shift());
            assert.equal(atomic.getPorts().length, outPorts.length + inPorts.length);
            assert.deepEqual(atomic.get('inPorts'), inPorts);
            assert.deepEqual(atomic.get('outPorts'), outPorts);

            atomic.removeOutPort('non-existent port');
            assert.deepEqual(atomic.get('inPorts'), inPorts);
            assert.deepEqual(atomic.get('outPorts'), outPorts);

            atomic.removeOutPort(undefined).removeOutPort(null);
            assert.deepEqual(atomic.get('inPorts'), inPorts);
            assert.deepEqual(atomic.get('outPorts'), outPorts);
        });

        QUnit.test('removeInPort', function(assert) {

            var outPorts = _.clone(atomic.get('outPorts'));
            var inPorts = _.clone(atomic.get('inPorts'));

            atomic.removeInPort(inPorts.shift()).removeInPort(inPorts.shift());
            assert.equal(atomic.getPorts().length, outPorts.length + inPorts.length);
            assert.deepEqual(atomic.get('inPorts'), inPorts);
            assert.deepEqual(atomic.get('outPorts'), outPorts);

            atomic.removeInPort('non-existent port');
            assert.deepEqual(atomic.get('inPorts'), inPorts);
            assert.deepEqual(atomic.get('outPorts'), outPorts);

            atomic.removeInPort(undefined).removeInPort(null);
            assert.deepEqual(atomic.get('inPorts'), inPorts);
            assert.deepEqual(atomic.get('outPorts'), outPorts);
        });

        QUnit.test('changeInGroup', function(assert) {

            var propIn = _.cloneDeep(atomic.prop('ports/groups/in'));
            var propOut = _.cloneDeep(atomic.prop('ports/groups/out'));

            propIn.position = 'top';
            atomic.changeInGroup({ position: 'top' });

            assert.deepEqual(atomic.prop('ports/groups/in'), propIn);
            assert.deepEqual(atomic.prop('ports/groups/out'), propOut);

            atomic.changeInGroup(null).changeInGroup(undefined);
            assert.deepEqual(atomic.prop('ports/groups/in'), propIn);
            assert.deepEqual(atomic.prop('ports/groups/out'), propOut);
        });

        QUnit.test('changeOutGroup', function(assert) {

            var propIn = _.cloneDeep(atomic.prop('ports/groups/in'));
            var propOut = _.cloneDeep(atomic.prop('ports/groups/out'));

            propOut.position = 'bottom';
            atomic.changeOutGroup({ position: 'bottom' });

            assert.deepEqual(atomic.prop('ports/groups/in'), propIn);
            assert.deepEqual(atomic.prop('ports/groups/out'), propOut);

            atomic.changeOutGroup(null).changeOutGroup(undefined);
            assert.deepEqual(atomic.prop('ports/groups/in'), propIn);
            assert.deepEqual(atomic.prop('ports/groups/out'), propOut);
        });

        QUnit.test('add ports with duplicate names', function(assert) {

            coupled.addOutPort('out')
                .addOutPort('out')
                .addInPort('in')
                .addInPort('out')
                .addInPort('in');

            assert.equal(coupled.getPorts().length, 2);
            assert.deepEqual(coupled.get('inPorts'), ['in', 'out', 'in']);
            assert.deepEqual(coupled.get('outPorts'), ['out', 'out']);

            coupled.removeOutPort('out');

            assert.equal(coupled.getPorts().length, 2);
            assert.deepEqual(coupled.get('inPorts'), ['in', 'out', 'in']);
            assert.deepEqual(coupled.get('outPorts'), []);
        });
    });
});