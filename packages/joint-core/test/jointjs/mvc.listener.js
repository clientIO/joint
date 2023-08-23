'use strict';

const createPaperHTMLElement = () => {

    const fixtureEl = fixtures.getElement();
    const paperEl = document.createElement('div');
    fixtureEl.appendChild(paperEl);
    return paperEl;
};

QUnit.module('joint.mvc.Listener', (hooks) => {
    QUnit.test('passing/getting callbackArguments', (assert) => {
        const n1 = 100;
        const s1 = 'foo';
        const listener = new joint.mvc.Listener(n1, s1);
        const [cbArg1, cbArg2] = listener.callbackArguments;

        assert.equal(cbArg1, n1);
        assert.equal(cbArg2, s1);
    });

    QUnit.module('events', (hooks) => {
        hooks.beforeEach(() => {
            this.graph = new joint.dia.Graph;
            this.rect = new joint.shapes.standard.Rectangle();
            this.graph.resetCells([this.rect]);
        });

        hooks.afterEach(() => {
            this.graph = null;
            this.rect = null;
        });

        QUnit.test('stop listening', (assert) => {
            const newPosition = { x: 100, y: 100 };
            const newSize = { width: 100, height: 100 };

            const positionCb = sinon.spy();
            const sizeCb = sinon.spy();
            const rectEvents = {
                'change:size': sizeCb
            };

            const listener = new joint.mvc.Listener();
            listener.listenTo(this.graph, 'change:position', positionCb);
            listener.listenTo(this.rect, rectEvents);

            this.rect.position(newPosition.x, newPosition.y);
            this.rect.resize(newSize.width, newSize.height);
            listener.stopListening();
            this.rect.position(newPosition.x + 1, newPosition.y + 1);
            this.rect.resize(newSize.width + 1, newSize.height + 1);

            assert.ok(positionCb.calledOnce);
            assert.ok(sizeCb.calledOnce);
        });

        QUnit.module('signature 1', () => {
            QUnit.test('multiple objects', (assert) => {
                const newPosition = { x: 100, y: 100 };
                const args = [{ foo: 'bar' }, 'baz', 10];
                const paper = new joint.dia.Paper({
                    el: createPaperHTMLElement(),
                    gridSize: 10,
                    model: this.graph
                });

                const listener = new joint.mvc.Listener(...args);
                const graphCb = sinon.spy();
                const graphEvents = {
                    'change:position': graphCb
                };
                const paperCb = sinon.spy();
                const paperEvents = {
                    'render:done': paperCb
                };

                listener.listenTo(this.graph, graphEvents);
                listener.listenTo(paper, paperEvents);

                this.rect.position(newPosition.x, newPosition.y);
                this.rect.remove();
                assert.ok(graphCb.calledWith(...args, this.rect, newPosition));
                assert.ok(paperCb.calledWith(...args));

                paper.remove();
            });

            QUnit.test('no callbackArguments', (assert) => {
                const newPosition = { x: 100, y: 100 };

                const removeCb = sinon.spy();
                const positionCb = sinon.spy();

                const events = {
                    'remove': removeCb,
                    'change:position': positionCb
                };

                const listener = new joint.mvc.Listener();
                listener.listenTo(this.graph, events);

                this.rect.position(newPosition.x, newPosition.y);
                this.rect.remove();
                assert.ok(removeCb.calledWith(this.rect));
                assert.ok(positionCb.calledWith(this.rect, newPosition));
            });

            QUnit.test('pass callbackArguments', (assert) => {
                const newPosition = { x: 100, y: 100 };
                const args = [{ foo: 'bar' }, 'baz', 10];

                const removeCb = sinon.spy();
                const positionCb = sinon.spy();

                const events = {
                    'remove': removeCb,
                    'change:position': positionCb
                };

                const listener = new joint.mvc.Listener(...args);
                listener.listenTo(this.graph, events);

                this.rect.position(newPosition.x, newPosition.y);
                this.rect.remove();
                assert.ok(removeCb.calledWith(...args, this.rect));
                assert.ok(positionCb.calledWith(...args, this.rect, newPosition));
            });

            QUnit.test('call on context', (assert) => {
                const newPosition = { x: 100, y: 100 };
                const args = [{ foo: 'bar' }, 'baz', 10];
                const context = { foo: 'bar' };

                const removeCb = sinon.spy();
                const positionCb = sinon.spy();

                const events = {
                    'remove': removeCb,
                    'change:position': positionCb
                };

                const listener = new joint.mvc.Listener(...args);
                listener.listenTo(this.graph, events, context);

                this.rect.position(newPosition.x, newPosition.y);
                this.rect.remove();
                assert.ok(removeCb.calledOn(context));
                assert.ok(removeCb.calledWith(...args, this.rect));
                assert.ok(positionCb.calledOn(context));
                assert.ok(positionCb.calledWith(...args, this.rect, newPosition));
            });
        });

        QUnit.module('signature 2', () => {
            QUnit.test('multiple objects', (assert) => {
                const newPosition = { x: 100, y: 100 };
                const paper = new joint.dia.Paper({
                    el: createPaperHTMLElement(),
                    gridSize: 10,
                    model: this.graph
                });

                const listener = new joint.mvc.Listener();
                const graphCb = sinon.spy();
                const paperCb = sinon.spy();
                listener.listenTo(this.graph, 'change:position', graphCb);
                listener.listenTo(paper, 'render:done', paperCb);

                this.rect.position(newPosition.x, newPosition.y);
                assert.ok(graphCb.calledWith(this.rect, newPosition));
                assert.ok(paperCb.called);

                paper.remove();
            });

            QUnit.test('no callbackArguments', (assert) => {
                const newPosition = { x: 100, y: 100 };

                const listener = new joint.mvc.Listener();
                const callback = sinon.spy();
                listener.listenTo(this.graph, 'change:position', callback);

                this.rect.position(newPosition.x, newPosition.y);
                assert.ok(callback.calledWith(this.rect, newPosition));
            });

            QUnit.test('pass callbackArguments', (assert) => {
                const newPosition = { x: 100, y: 100 };
                const args = [{ foo: 'bar' }, 'baz', 10];

                const listener = new joint.mvc.Listener(...args);
                const callback = sinon.spy();
                listener.listenTo(this.graph, 'change:position', callback);

                this.rect.position(newPosition.x, newPosition.y);
                assert.ok(callback.calledWith(...args, this.rect, newPosition));
            });

            QUnit.test('call on context', (assert) => {
                const newPosition = { x: 100, y: 100 };
                const args = [{ foo: 'bar' }, 'baz', 10];
                const context = { foo: 'bar' };

                const listener = new joint.mvc.Listener(...args);
                const callback = sinon.spy();
                listener.listenTo(this.graph, 'change:position', callback, context);

                this.rect.position(newPosition.x, newPosition.y);
                assert.ok(callback.calledOn(context));
                assert.ok(callback.calledWith(...args, this.rect, newPosition));
            });
        });
    });
});
