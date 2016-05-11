QUnit.module('element ports', function() {

    var Model = joint.dia.Element.extend({

        markup: '<g class="rotatable"><g class="scalable"><rect class="rectangle"/></g><text/></g>',
        portMarkup: '<circle class="circle-port" />',
        defaults: joint.util.deepSupplement({
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

            var shape = create({ items: [{ 'group': 'in' }] });
            var eventSpy = sinon.spy();

            shape.on('all', eventSpy);
            shape.addPorts([{ id: 'a' }]);
            assert.ok(eventSpy.calledTwice);
            assert.equal(shape.getPorts().length, 2);
            assert.equal(shape.getPorts()[1].id, 'a');
            assert.ok(typeof shape.getPorts()[0].id === 'string');
        });

        QUnit.test('remove port - by object', function(assert) {

            var shape = create({ items: [{ id: 'aaa', 'group': 'in' }, { id: 'xxx', 'group': 'in' }] });
            var eventSpy = sinon.spy();

            shape.on('all', eventSpy);
            shape.removePort(shape.getPort('aaa'));
            assert.ok(eventSpy.calledTwice);
            assert.equal(shape.getPorts().length, 1);
            assert.equal(shape.getPorts()[0].id, 'xxx');
        });

        QUnit.test('remove port - by id', function(assert) {

            var shape = create({ items: [{ id: 'aaa', 'group_id': 'in' }, { id: 'xxx', 'group_id': 'in' }] });
            var eventSpy = sinon.spy();

            shape.on('all', eventSpy);
            shape.removePort('aaa');
            assert.ok(eventSpy.calledTwice);
            assert.equal(shape.getPorts().length, 1);
            assert.equal(shape.getPorts()[0].id, 'xxx');
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

            assert.equal(shapeView.$el.find('.port').length, 2);

            var fst = shapeView.$el.find('.firstport');
            var rect = fst.find('rect');
            var text = fst.find('.text');
            assert.equal(fst.length, 1);
            assert.equal(rect.length, 1);
            assert.equal(text.length, 1);
            assert.equal(text.attr('fill'), 'blue');
            assert.equal(text.text(), 'aaa');

            var snd = shapeView.$el.find('.port').eq(1);
            var sndPortShape = snd.children().eq(0);
            assert.equal(snd.length, 1);
            assert.equal(sndPortShape[0].tagName.toLowerCase(), $(shape.portMarkup)[0].tagName.toLowerCase());
            assert.equal(sndPortShape.attr('fill'), 'red');
        });

        QUnit.test('render custom port markup', function(assert) {
            var WithoutPorts = joint.dia.Element.extend({
                markup: '<g class="rotatable"><g class="scalable"><rect class="rectangle"/></g><text/></g>',
                portMarkup: '<circle class="custom-port-markup"/>',
                defaults: joint.util.deepSupplement({ type: 'temp' }, joint.dia.Element.prototype.defaults)
            });

            var model = new WithoutPorts();
            var shapeView = new joint.dia.ElementView({ model: model });
            model.addPorts([{ id: 'a' }, { id: 'b', markup: '<rect class="custom-rect" />' }]);

            shapeView.render();

            assert.equal(shapeView.$el.find('.port').length, 2, 'port wraps');

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

            assert.equal(view.vel.find('.port').length, 2);
            view._removePorts();
            assert.equal(view.vel.find('.port').length, 0, 'ports elements removed');
        });
    });

    QUnit.module('port grouping', function() {

        QUnit.test('resolve position args', function(assert) {

            var data = {
                groups: {
                    'a': {
                        position: {
                            name: 'right',
                            args: { dx: -10 }
                        }
                    }, 'b': {
                        position: 'top'
                    }
                },
                items: [
                    {
                        id: 'pa',
                        args: { dy: 20 },
                        group: 'a'
                    },
                    {
                        id: 'pb',
                        args: { dy: 20 },
                        group: 'b'
                    }
                ]
            };

            var shape = create(data);
            var view = new joint.dia.ElementView({ model: shape }).render();

            var portData = shape.portData;

            assert.equal(portData.getPort('pa').position.name, 'right');
            assert.equal(portData.getPort('pa').position.args.dy, 20);
            assert.equal(portData.getPort('pa').position.args.dx, -10);

            assert.equal(portData.getPort('pb').position.name, 'top');
            assert.equal(portData.getPort('pb').position.args.dy, 20);
        });

        QUnit.test('elements order with z-index', function(assert) {

            var data = {
                items: [
                    { z: 2, id: '2-0' },
                    { z: 0, id: '0-0' },
                    { z: 1, id: '1-0' },
                    { z: 0, id: '0-1' },
                    { z: 1, id: '1-1' },
                    { z: 0, id: '0-2' },
                    { id: 'x' }
                ]
            };

            var shape = create(data);
            var view = new joint.dia.ElementView({ model: shape }).render();

            var nodes = view.$el.find('.rotatable').children();

            assert.equal(nodes.eq(0).find('[port]').attr('port'), '0-0', 'z index 0, 0nth node');
            assert.equal(nodes.eq(1).find('[port]').attr('port'), '0-1');
            assert.equal(nodes.eq(2).find('[port]').attr('port'), '0-2');

            assert.ok(nodes.eq(3).hasClass('scalable'));

            assert.equal(nodes.eq(4).find('[port]').attr('port'), '1-0');
            assert.equal(nodes.eq(5).find('[port]').attr('port'), '1-1');

            assert.equal(nodes.eq(6)[0].tagName, 'text');

            assert.equal(nodes.eq(7).find('[port]').attr('port'), '2-0');
            assert.equal(nodes.eq(8).find('[port]').attr('port'), 'x');
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

        QUnit.test('resolve port labels', function(assert) {

            var data = {
                groups: {
                    'a': {
                        label: { position: 'right' }
                    }, 'b': {}
                },
                items: [
                    { id: 'pa1', group: 'a', label: { position: { name: 'top', args: { dx: 11 } } } },
                    { id: 'pa2', group: 'a' },
                    { id: 'pb1', group: 'b', label: { position: { args: { dx: 11 } } } },
                    { id: 'pb2', group: 'b' }
                ]
            };

            var shape = create(data);
            var view = new joint.dia.ElementView({ model: shape }).render();

            var portData = shape.portData;

            assert.equal(portData.getPort('pa1').label.position.name, 'top', 'override group settings');
            assert.equal(portData.getPort('pa1').label.position.args.dx, 11);

            assert.equal(portData.getPort('pa2').label.position.name, 'right', 'gets settings from group');

            assert.equal(portData.getPort('pb1').label.position.name, 'left', 'default settings, extra args');
            assert.equal(portData.getPort('pb1').label.position.args.dx, 11);

            assert.equal(portData.getPort('pb2').label.position.name, 'left', 'defaults - no settings on group, either on port label');
        });
    });
});
