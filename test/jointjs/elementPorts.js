QUnit.module('element ports', function() {

    var Model = joint.dia.Element.extend({

        markup: '<g class="rotatable"><g class="scalable"><rect class="rectangle"/></g><text/></g>',
        portMarkup: '<circle class="circle-port" />',
        defaults: _.defaultsDeep({
            type: 'basic.Model'

        }, joint.dia.Element.prototype.defaults)
    });

    var create = function(initialPorts) {

        return new Model({
            ports: initialPorts
        });
    };

    QUnit.module('port collection operations', function() {

        QUnit.test('simple getters/setters', function(assert) {

            var shape = create();
            assert.equal(shape.getPorts().length, 0);

            var portDefinition = {
                id: 'first'
            };

            shape.addPort(portDefinition);
            assert.equal(shape.getPorts().length, 1);

            var p2 = {
                id: 'second'
            };

            var p3 = {
                id: 'third'
            };

            shape.addPorts([p2, p3]);
            assert.equal(shape.getPorts().length, 3);
            assert.equal(shape.getPorts()[0].id, 'first');
        });

        QUnit.test('initial ports', function(assert) {

            var shape = create({ items: [{ 'group': 'in' }] });
            assert.equal(shape.getPorts().length, 1);
        });

        QUnit.test('addPorts', function(assert) {

            var shape = create({ items: [{ group: 'in' }] });

            var eventOrder = ['ports:add', 'change:ports', 'change'];

            shape.on('all', function(eventName) {
                assert.equal(eventName, eventOrder.shift())
            });

            shape.addPort({ id: 'a' });
            assert.equal(shape.getPorts().length, 2);
            assert.equal(shape.getPorts()[1].id, 'a');
            assert.ok(typeof shape.getPorts()[0].id === 'string');
        });

        QUnit.test('remove port - by object', function(assert) {

            var shape = create({ items: [{ id: 'aaa', 'group': 'in' }, { id: 'xxx', 'group': 'in' }] });

            var eventOrder = ['ports:remove', 'change:ports', 'change'];
            shape.on('all', function(eventName) {
                assert.equal(eventName, eventOrder.shift())
            });

            shape.removePort(shape.getPort('aaa'));
            assert.equal(shape.getPorts().length, 1);
            assert.equal(shape.getPorts()[0].id, 'xxx');
        });

        QUnit.test('remove port - by id', function(assert) {

            var shape = create({ items: [{ id: 'aaa', 'group_id': 'in' }, { id: 'xxx', 'group_id': 'in' }] });

            var eventOrder = ['ports:remove', 'change:ports', 'change'];
            shape.on('all', function(eventName) {
                assert.equal(eventName, eventOrder.shift())
            });

            shape.removePort('aaa');
            assert.equal(shape.getPorts().length, 1);
            assert.equal(shape.getPorts()[0].id, 'xxx');
        });

        QUnit.test('remove port - invalid reference - should not remove any port', function(assert) {

            var shape = create({ items: [{ id: 'aaa', 'group_id': 'in' }, { id: 'xxx', 'group_id': 'in' }] });

            shape.removePort();
            assert.equal(shape.getPorts().length, 2);

            shape.removePort('non-existing-port');
            assert.equal(shape.getPorts().length, 2);
        });

        QUnit.test('getPortIndex', function(assert) {

            var idObject = {};
            var ports = [
                {},
                { id: 'aaa', 'group_id': 'in' },
                { id: 'xxx', 'group_id': 'in' },
                { x: 'whatever' },
                { id: '' },
                { id: 0 },
                { id: false },
                { id: true },
                { id: idObject }
            ];
            var shape = create({ items: ports });

            assert.equal(shape.getPortIndex('xxx'), 2);
            assert.equal(shape.getPortIndex(ports[1]), 1);
            assert.equal(shape.getPortIndex(), -1);
            assert.equal(shape.getPortIndex(null), -1);
            assert.equal(shape.getPortIndex(undefined), -1);
            assert.equal(shape.getPortIndex(''), 4);
            assert.equal(shape.getPortIndex(0), 5);
            assert.equal(shape.getPortIndex(false), 6);
            assert.equal(shape.getPortIndex(true), 7);
            assert.equal(shape.getPortIndex(idObject), -1);
        });

        QUnit.test('initialized with no ports', function(assert) {

            var shape = create();
            assert.equal(shape.getPorts().length, 0);
        });

        QUnit.module('ids', function() {

            QUnit.test('duplicate id', function(assert) {

                assert.throws(function() {
                    create({ items: [{ 'group_id': 'in' }, { id: 'a' }, { id: 'a' }] });
                }, function(err) {
                    return err.toString().indexOf('duplicities') !== -1;
                });

            });

            QUnit.test('duplicate id - add port', function(assert) {

                var shape = create({ items: [{ id: 'a' }] });
                assert.throws(function() {
                    shape.addPort({ id: 'a' });
                }, function(err) {
                    return err.toString().indexOf('duplicities ') !== -1;
                });

            });

            QUnit.test('duplicate id - add ports', function(assert) {

                var shape = create({ items: [{ id: 'a' }] });
                assert.throws(function() {
                    shape.addPorts([{ id: 'x' }, { id: 'x' }]);
                }, function(err) {
                    return err.toString().indexOf('duplicities') !== -1;
                });
            });

            QUnit.test('auto generated id', function(assert) {

                var shape = create({ items: [{ 'group': 'in' }] });

                assert.equal(shape.getPorts().length, 1);
                assert.ok(shape.getPorts()[0].id !== undefined, 'normalized on initialization');

                shape.addPort({ group: 'a' });
                assert.equal(shape.getPorts().length, 2);
                assert.ok(shape.getPorts()[1].id !== undefined);
            });
        });
    });

    QUnit.module('attributes and markup', function() {

        QUnit.test('is rendered correctly', function(assert) {

            var ports = [
                {
                    id: 'fst',
                    markup: '<g class="firstport"><rect/><text class="text"/></g>',
                    attrs: {
                        '.text': {
                            fill: 'blue',
                            text: 'aaa'
                        }
                    }
                },
                {
                    id: 'snd',
                    attrs: {
                        'circle': {
                            fill: 'red'
                        }
                    }
                }
            ];

            var shape = create({ items: ports });

            var shapeView = new joint.dia.ElementView({ model: shape });
            var renderPortSpy = sinon.spy(shapeView, '_createPortElement');

            shapeView.render();

            assert.ok(renderPortSpy.calledTwice);

            assert.equal(shapeView.$el.find('.joint-port').length, 2);

            var fst = shapeView.$el.find('.firstport');
            var rect = fst.find('rect');
            var text = fst.find('.text');
            assert.equal(fst.length, 1);
            assert.equal(rect.length, 1);
            assert.equal(text.length, 1);
            assert.equal(text.attr('fill'), 'blue');
            assert.equal(text.text(), 'aaa');

            var snd = shapeView.$el.find('.joint-port').eq(1);
            var sndPortShape = snd.children().eq(0);
            assert.equal(snd.length, 1);
            assert.equal(sndPortShape[0].tagName.toLowerCase(), $(shape.portMarkup)[0].tagName.toLowerCase());
            assert.equal(sndPortShape.attr('fill'), 'red');
        });

        QUnit.test('render custom port markup', function(assert) {
            var WithoutPorts = joint.dia.Element.extend({
                markup: '<g class="rotatable"><g class="scalable"><rect class="rectangle"/></g><text/></g>',
                portMarkup: '<circle class="custom-port-markup"/>',
                defaults: _.defaultsDeep({ type: 'temp' }, joint.dia.Element.prototype.defaults)
            });

            var model = new WithoutPorts();
            var shapeView = new joint.dia.ElementView({ model: model });
            model.addPorts([{ id: 'a' }, { id: 'b', markup: '<rect class="custom-rect" />' }]);

            shapeView.render();

            assert.equal(shapeView.$el.find('.joint-port').length, 2, 'port wraps');

            assert.equal(shapeView.$el.find('.custom-port-markup').length, 1);
            assert.equal(shapeView.$el.find('.custom-port-markup').prop('tagName'), 'circle');

            assert.equal(shapeView.$el.find('.custom-rect').length, 1);
            assert.equal(shapeView.$el.find('.custom-rect').prop('tagName'), 'rect');
        });
    });

    QUnit.module('port update', function() {

        QUnit.test('remove port elements from DOM', function(assert) {

            var element = create();

            element.addPorts([{ id: 'a' }, { id: 'b' }]);

            var view = new joint.dia.ElementView({ model: element });

            view.render();

            assert.equal(view.vel.find('.joint-port').length, 2);
            view._removePorts();
            assert.equal(view.vel.find('.joint-port').length, 0, 'ports elements removed');
        });
    });

    QUnit.module('z - index', function(hooks) {

        QUnit.module('evaluate from definition', function(hooks) {

            QUnit.test('test name', function(assert) {

                var shape = create({
                    groups: { 'a': { z: 0 }}
                });

                shape.addPorts([
                    { z: 0 },
                    { z: 'auto' },
                    { z: undefined },
                    { group: 'a' }
                ]);

                var ports = shape._portSettingsData.getPorts();

                assert.equal(ports[0].z, 0);
                assert.equal(ports[1].z, 'auto');
                assert.equal(ports[2].z, 'auto');
                assert.equal(ports[3].z, 0);
            });
        });

        QUnit.test('elements order with z-index', function(assert) {

            var data = {
                items: [
                    { z: 7, id: '7' },
                    { z: 6, id: '6' },
                    { z: 5, id: '5' },
                    { z: 4, id: '4' },
                    { id: 'x' },
                    { z: 3, id: '3' },
                    { z: 2, id: '2' },
                    { z: 1, id: '1' },
                    { z: 0, id: '0-1' },
                    { z: 0, id: '0-2' },
                    { z: 0, id: '0-3' }
                ]
            };

            var shape = create(data);
            var view = new joint.dia.ElementView({ model: shape }).render();

            var nodes = view.$el.find('.rotatable').children();

            // var result = [];
            // _.each(nodes, function(n) {
            //     result.push($(n).find('[port]').attr('port'));
            // });
            // console.log(result);

            var i = 0;
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '0-1', 'z index 0, 0nth node');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '0-2');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '0-3');
            assert.ok(nodes.eq(i++).hasClass('scalable'));
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '1');
            assert.equal(nodes.eq(i++)[0].tagName, 'text');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '2');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), 'x');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '3');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '4');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '5');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '6');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '7');
        });

        QUnit.test('elements order with z-index and without', function(assert) {

            var data = {
                items: [
                    { id: '111' },
                    { id: '1' },
                    { id: '2' },
                    { id: '0001' },
                    { z: 20, id: 'z20' },
                    { z: 30, id: 'z30' }
                ]
            };

            var shape = create(data);
            var view = new joint.dia.ElementView({ model: shape }).render();

            var nodes = view.$el.find('.rotatable').children();

            // var result = [];
            // _.each(nodes, function(n) {
            //     result.push($(n).find('[port]').attr('port'));
            // });
            // console.log(result);

            var i = 0;
            assert.ok(nodes.eq(i++).hasClass('scalable'));
            assert.equal(nodes.eq(i++)[0].tagName, 'text');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '111');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '1');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '2');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), '0001');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), 'z20');
            assert.equal(nodes.eq(i++).find('[port]').attr('port'), 'z30');
        });

        QUnit.test('elements order - no z-index defined', function(assert) {

            var data = {
                items: [
                    { id: 'a' },
                    { id: 'b' },
                    { id: 'c' }
                ]
            };

            var shape = create(data);
            var view = new joint.dia.ElementView({ model: shape }).render();

            var nodes = view.$el.find('.rotatable').children();

            assert.ok(nodes.eq(0).hasClass('scalable'));
            assert.equal(nodes.eq(1)[0].tagName, 'text');

            assert.equal(nodes.eq(2).find('[port]').attr('port'), 'a');
            assert.equal(nodes.eq(3).find('[port]').attr('port'), 'b');
            assert.equal(nodes.eq(4).find('[port]').attr('port'), 'c');
        });
    });

    QUnit.module('port grouping', function() {

        QUnit.test('resolve position args', function(assert) {

            var data = {
                groups: {
                    'a': {
                        position: {
                            name: 'right',
                            args: { x: 10, y: 11, angle: 12 }
                        },
                        label: {
                            position: {
                                name: 'lefts',
                                args: { x: 10, y: 20, angle: 30 }
                            }
                        }

                    }, 'b': {
                        position: 'top'
                    }
                },
                items: [
                    {
                        id: 'pa',
                        args: { y: 20 },
                        group: 'a'
                    },
                    {
                        id: 'pb',
                        args: { y: 20 },
                        group: 'b'
                    }
                ]
            };

            var shape = create(data);
            new joint.dia.ElementView({ model: shape }).render();

            var getPort = function(id) {
                return _.find(shape._portSettingsData.ports, function(p) {
                    return p.id === id;
                });
            };

            assert.equal(getPort('pa').position.name, 'right');
            assert.equal(getPort('pa').position.args.y, 20);
            assert.equal(getPort('pa').position.args.x, 10);

            assert.equal(getPort('pb').position.name, 'top');
            assert.equal(getPort('pb').position.args.y, 20);
        });

        QUnit.test('resolve port labels', function(assert) {

            var data = {
                groups: {
                    'a': {
                        label: {
                            position: {
                                name: 'right',
                                args: { ty: 20 }
                            }
                        }
                    }, 'b': {}
                },
                items: [
                    { id: 'pa1', group: 'a', label: { position: { name: 'top', args: { tx: 11 }}}},
                    { id: 'pa2', group: 'a' },
                    { id: 'pb1', group: 'b', label: { position: { args: { tx: 11 }}}},
                    { id: 'pb2', group: 'b' }
                ]
            };

            var shape = create(data);
            new joint.dia.ElementView({ model: shape }).render();

            var getPort = function(id) {
                return _.find(shape._portSettingsData.ports, function(p) {
                    return p.id === id;
                });
            };

            assert.equal(getPort('pa1').label.position.name, 'top', 'override group settings');
            assert.equal(getPort('pa1').label.position.args.tx, 11);
            assert.equal(getPort('pa1').label.position.args.ty, 20);

            assert.equal(getPort('pa2').label.position.name, 'right', 'gets settings from group');

            assert.equal(getPort('pb1').label.position.name, 'left', 'default settings, extra args');
            assert.equal(getPort('pb1').label.position.args.tx, 11);

            assert.equal(getPort('pb2').label.position.name, 'left', 'defaults - no settings on group, either on port label');
        });
    });

    QUnit.module('port layout', function(hooks) {

        QUnit.test('straight line layouts', function(assert) {
            var elBBox = g.rect(0, 0, 100, 100);

            var trans = joint.layout.Port.left([
                {},
                {},
                { dx: 20, dy: -15 },
                { y: 100, x: 100, angle: 45 }
            ], elBBox, {});

            var delta = trans[1].y - trans[0].y;

            assert.equal(trans[0].y + delta, trans[1].y);
            assert.equal(trans[0].x, 0);
            assert.equal(trans[0].angle, 0);

            assert.equal(trans[2].x, 20);
            assert.equal(trans[2].y, trans[1].y + delta - 15, 'offset y should be applied');
            assert.equal(trans[2].angle, 0);

            assert.equal(trans[3].angle, 45);
            assert.equal(trans[3].y, 100, 'override y position');
            assert.equal(trans[3].x, 100, 'override y position');
        });

        QUnit.test('circular layouts', function(assert) {

            var elBBox = g.rect(0, 0, 100, 100);

            var trans = joint.layout.Port.ellipseSpread([
                {},
                { dr: 3, compensateRotation: true },
                { dx: 1, dy: 2, dr: 3 },
                { x: 100, y: 101, angle: 10 }
            ], elBBox, {});

            assert.equal(Math.round(trans[1].angle), -270, 'rotation compensation applied');
            assert.equal(trans[1].x, 100 + 3, 'dr is applied');
            assert.equal(trans[1].y, 50);

            // middle bottom
            assert.equal(trans[2].x, 50 + 1, 'dx is applied');
            assert.equal(trans[2].y, 100 + 2 + 3, 'dy, dr are applied');

            assert.equal(trans[3].x, 100, 'x position overridden');
            assert.equal(trans[3].y, 101, 'y position overridden');
            assert.equal(trans[3].angle, 10, 'y position overridden');
        });
    });

    QUnit.module('getPortsPositions', function() {

        QUnit.test('ports positions can be retrieved even if element is not rendered yet', function(assert) {

            var shape = create({
                groups: {
                    'a': { position: 'left' }
                },
                items: [
                    { id: 'one', group: 'a' },
                    { id: 'two', group: 'a' },
                    { id: 'three', group: 'a' }
                ]
            }).set('size', { width: 5, height: 10 });

            var portsPositions = shape.getPortsPositions('a');

            assert.ok(portsPositions.one.y > 0);
            assert.ok(portsPositions.one.y < portsPositions.two.y);
            assert.ok(portsPositions.two.y < portsPositions.three.y);
        });
    });

    QUnit.module('portProp', function() {

        QUnit.test('set port properties', function(assert) {

            var shape = create({
                items: [
                    { id: 'one', attrs: { '.body': { fill: 'red' }}}
                ]
            });

            shape.portProp('one', 'attrs/.body/fill-opacity', 1);
            assert.equal(shape.prop('ports/items/0/attrs/.body/fill-opacity'), 1);

            shape.portProp('one', 'attrs/.body', { fill: 'newcolor' });
            assert.equal(shape.prop('ports/items/0/attrs/.body/fill'), 'newcolor');

            shape.portProp('one', 'attrs/.body', {});
            assert.equal(shape.prop('ports/items/0/attrs/.body/fill'), 'newcolor');

            shape.portProp('one', { attrs: { '.body': { fill: 'black', x: 1 }}});
            assert.equal(shape.prop('ports/items/0/attrs/.body/fill'), 'black');
            assert.equal(shape.prop('ports/items/0/attrs/.body/x'), 1);
        });

        QUnit.test('get port properties', function(assert) {

            var shape = create({
                items: [
                    { id: 'one', attrs: { '.body': { fill: 'red' }}}
                ]
            });

            var prop = shape.portProp('one', 'attrs/.body');
            assert.equal(prop.fill, 'red');

            prop = shape.portProp('one');
            assert.ok(prop.id, 'red');
        });

        QUnit.test('set port props, path defined as an array', function(assert) {

            var shape = create({
                items: [
                    { id: 'one' }
                ]
            });

            shape.portProp('one', ['array', 20], 'array item');
            shape.portProp('one', ['object', '20'], 'object property');

            assert.ok(_.isArray(shape.portProp('one', 'array')));
            assert.equal(shape.portProp('one', 'array')[20], 'array item');

            assert.ok(_.isPlainObject(shape.portProp('one', 'object')));
            assert.equal(shape.portProp('one', 'object/20'), 'object property');
        })
    });

    QUnit.module('event ports:add and ports:remove', function(hooks) {

        QUnit.config.testTimeout = 5000;

        QUnit.test('simple add', function(assert) {

            var shape = create({ items: [{}] });

            assert.expect(3);
            assert.equal(shape.getPorts().length, 1);

            var done = assert.async();

            shape.on('ports:add', function(cell, ports) {
                assert.equal(ports.length, 1);
                assert.equal(ports[0].id, 'a');
                done();
            });

            shape.addPort({ id: 'a' })
        });

        QUnit.test('rewrite', function(assert) {

            var shape = create({ items: [{ id: 'a' }] });

            assert.expect(5);
            assert.equal(shape.getPorts().length, 1);

            var eventAddDone = assert.async();
            var eventRemoveDone = assert.async();

            shape.on('ports:add', function(cell, ports) {
                assert.equal(ports.length, 1);
                assert.equal(ports[0].id, 'b');
                eventAddDone();
            });

            shape.on('ports:remove', function(cell, ports) {
                assert.equal(ports.length, 1);
                assert.equal(ports[0].id, 'a');
                eventRemoveDone();
            });

            shape.prop('ports/items', [{ id: 'b' }], { rewrite: true });
        });

        QUnit.test('change id', function(assert) {

            var shape = create({ items: [{ id: 'a' }] });

            assert.expect(5);
            assert.equal(shape.getPorts().length, 1);

            var eventAddDone = assert.async();
            var eventRemoveDone = assert.async();

            shape.on('ports:add', function(cell, ports) {
                assert.equal(ports.length, 1);
                assert.equal(ports[0].id, 'b');
                eventAddDone();
            });

            shape.on('ports:remove', function(cell, ports) {
                assert.equal(ports.length, 1);
                assert.equal(ports[0].id, 'a');
                eventRemoveDone();
            });

            shape.prop('ports/items/0/id', 'b');
        });

        QUnit.test('failed to add', function(assert) {

            var shape = create({ items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });

            assert.expect(3);
            assert.equal(shape.getPorts().length, 3);

            var done = assert.async();

            shape.on('ports:remove', function(cell, ports) {
                assert.equal(ports.length, 1);
                assert.equal(ports[0].id, 'a');
                done();
            });

            shape.removePort('a');
        });

        QUnit.test('add multiple', function(assert) {

            var shape = create({ items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });

            assert.expect(4);
            assert.equal(shape.getPorts().length, 3);

            var done = assert.async();

            shape.on('ports:add', function(cell, ports) {
                assert.equal(ports.length, 2);
                assert.equal(ports[0].id, 'x');
                assert.equal(ports[1].id, 'y');
                done();
            });

            shape.addPorts([{ id: 'x' }, { id: 'y' }]);
        });
    })
});
