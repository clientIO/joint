'use strict';

QUnit.module('dia.Paper.startLinkDrag()', function(hooks) {

    const { HighlighterView } = joint.dia;
    const DOCUMENT_EVENT_TYPES = ['pointermove', 'pointerup', 'pointerdown', 'keydown', 'contextmenu'];

    let paper;
    let graph;
    let r1;
    let r2;
    let r2View;
    let link;

    function clientPoint(x, y) {
        return paper.localToClientPoint(x, y);
    }

    function dispatchPointerEvent(type, target, x, y, init = {}) {
        const { x: clientX, y: clientY } = clientPoint(x, y);
        const evt = new PointerEvent(type, {
            clientX,
            clientY,
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            ...init
        });
        target.dispatchEvent(evt);
        return evt;
    }

    function pressEscape() {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }

    function newLink() {
        return new joint.shapes.standard.Link({ source: { x: 10, y: 10 }, target: { x: 20, y: 20 }});
    }

    hooks.beforeEach(function() {
        fixtures.moveToViewport();
        graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        paper = new joint.dia.Paper({
            el: $('<div/>').appendTo(fixtures.getElement()),
            model: graph,
            cellViewNamespace: joint.shapes,
            width: 400,
            height: 400
        });
        r1 = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        r2 = new joint.shapes.standard.Rectangle({ position: { x: 250, y: 250 }, size: { width: 100, height: 100 }});
        link = new joint.shapes.standard.Link({ source: { id: r1.id }, target: { x: 150, y: 150 }});
        graph.addCells([r1, r2, link]);
        r2View = r2.findView(paper);
    });

    hooks.afterEach(function() {
        paper.remove();
        fixtures.moveOffscreen();
        paper = null;
        graph = null;
    });

    QUnit.module('manual control', function() {

        QUnit.test('returns an active handle for the target end', function(assert) {
            const drag = paper.startLinkDrag(link);
            assert.ok(drag instanceof joint.dia.LinkDrag);
            assert.ok(drag.isActive());
            assert.equal(drag.link, link);
            assert.equal(drag.linkView, link.findView(paper));
            assert.equal(drag.end, 'target');
            assert.equal(drag.linkView.el.style.pointerEvents, 'none', 'the link does not catch pointer events while dragged');
            drag.cancel();
            assert.equal(drag.linkView.el.style.pointerEvents, '', 'pointer events are restored');
        });

        QUnit.test('move() and finish() with local coordinates connect the link', function(assert) {
            const connectSpy = sinon.spy();
            paper.on('link:connect', connectSpy);
            const drag = paper.startLinkDrag(link);
            drag.move(300, 300);
            assert.deepEqual(link.target(), { x: 300, y: 300 }, 'the end follows the point');
            assert.ok(HighlighterView.has(r2View), 'the element under the point is highlighted');
            drag.finish(300, 300);
            assert.notOk(drag.isActive());
            assert.equal(link.target().id, r2.id);
            assert.equal(HighlighterView.getAll(paper).length, 0, 'no highlighter is left behind');
            assert.ok(connectSpy.calledOnce);
            const [linkView, , targetView, , end] = connectSpy.args[0];
            assert.equal(linkView, drag.linkView);
            assert.equal(targetView, r2View);
            assert.equal(end, 'target');
        });

        QUnit.test('cancel() restores the end and leaves no highlighters behind', function(assert) {
            const connectSpy = sinon.spy();
            paper.on('link:connect', connectSpy);
            const drag = paper.startLinkDrag(link);
            drag.move(300, 300);
            assert.deepEqual(link.target(), { x: 300, y: 300 });
            assert.ok(HighlighterView.has(r2View));
            drag.cancel();
            assert.notOk(drag.isActive());
            assert.deepEqual(link.target(), { x: 150, y: 150 });
            assert.equal(HighlighterView.getAll(paper).length, 0);
            assert.notOk(connectSpy.called);
            assert.ok(graph.getCell(link.id), 'the link stays in the graph');
        });

        QUnit.test('end option selects the source end', function(assert) {
            const drag = paper.startLinkDrag(link, { end: 'source' });
            assert.equal(drag.end, 'source');
            drag.move(300, 300);
            drag.finish(300, 300);
            assert.equal(link.source().id, r2.id);
            assert.deepEqual(link.target(), { x: 150, y: 150 });
        });

        QUnit.test('whenNotAllowed: "remove" removes the link on cancel()', function(assert) {
            const drag = paper.startLinkDrag(link, { whenNotAllowed: 'remove' });
            drag.move(300, 300);
            drag.cancel();
            assert.notOk(graph.getCell(link.id));
            assert.notOk(drag.isActive());
            assert.equal(HighlighterView.getAll(paper).length, 0);
        });

        QUnit.test('methods are no-ops once the drag is over', function(assert) {
            const drag = paper.startLinkDrag(link);
            drag.finish(150, 150);
            drag.move(300, 300);
            assert.deepEqual(link.target(), { x: 150, y: 150 });
            drag.cancel();
            assert.ok(graph.getCell(link.id));
            assert.notOk(drag.isActive());
        });

        QUnit.test('move() with an event uses its client coordinates snapped to the grid', function(assert) {
            paper.options.gridSize = 10;
            const drag = paper.startLinkDrag(link);
            const { x: clientX, y: clientY } = clientPoint(123, 177);
            drag.move({ type: 'pointermove', clientX, clientY, target: paper.el });
            assert.deepEqual(link.target(), { x: 120, y: 180 });
            drag.finish({ type: 'pointerup', clientX, clientY, target: paper.el });
            assert.deepEqual(link.target(), { x: 120, y: 180 });
        });

        QUnit.test('move() and finish() with an event and explicit local coordinates', function(assert) {
            const drag = paper.startLinkDrag(link);
            const evt = { type: 'pointermove', target: r2View.el };
            drag.move(evt, 300, 300);
            assert.deepEqual(link.target(), { x: 300, y: 300 });
            assert.ok(HighlighterView.has(r2View));
            drag.finish({ type: 'pointerup', target: r2View.el }, 300, 300);
            assert.equal(link.target().id, r2.id);
        });

        QUnit.test('extra options are passed as the batch data', function(assert) {
            const log = [];
            graph.on('batch:start', (data) => log.push(data));
            graph.on('batch:stop', (data) => log.push(data));
            const drag = paper.startLinkDrag(link, { end: 'target', whenNotAllowed: 'revert', ui: true, tool: 'test' });
            drag.cancel();
            const batches = log.filter((data) => data.batchName === 'arrowhead-move');
            assert.equal(batches.length, 2);
            batches.forEach((data) => {
                assert.deepEqual(data, { batchName: 'arrowhead-move', ui: true, tool: 'test' });
            });
        });

        QUnit.test('the drag is wrapped in an "arrowhead-move" batch', function(assert) {
            const log = [];
            graph.on('batch:start', (data) => log.push('start:' + data.batchName));
            graph.on('batch:stop', (data) => log.push('stop:' + data.batchName));
            const drag = paper.startLinkDrag(link);
            drag.finish(300, 300);
            assert.deepEqual(
                log.filter((entry) => entry.endsWith(':arrowhead-move')),
                ['start:arrowhead-move', 'stop:arrowhead-move']
            );
        });
    });

    QUnit.module('link resolution', function() {

        QUnit.test('adds a link that is not in the graph inside an "add-link" batch', function(assert) {
            const log = [];
            graph.on('batch:start', (data) => log.push('start:' + data.batchName));
            graph.on('batch:stop', (data) => log.push('stop:' + data.batchName));
            graph.on('add', () => log.push('add'));
            const added = newLink();
            const drag = paper.startLinkDrag(added);
            assert.equal(added.graph, graph);
            assert.ok(drag.linkView.el.isConnected, 'the view is rendered and mounted');
            drag.move(300, 300);
            drag.finish(300, 300);
            assert.equal(added.target().id, r2.id);
            assert.deepEqual(
                log.filter((entry) => entry === 'add' || entry.endsWith(':add-link')),
                ['start:add-link', 'add', 'stop:add-link']
            );
        });

        QUnit.test('a link added by the paper is removed on cancel() by default', function(assert) {
            const added = newLink();
            const drag = paper.startLinkDrag(added);
            drag.cancel();
            assert.notOk(graph.getCell(added.id));
        });

        QUnit.test('a link added by the paper can be kept on cancel()', function(assert) {
            const added = newLink();
            const drag = paper.startLinkDrag(added, { whenNotAllowed: 'revert' });
            drag.move(300, 300);
            drag.cancel();
            assert.ok(graph.getCell(added.id));
            assert.deepEqual(added.target(), { x: 20, y: 20 });
        });

        QUnit.test('can be constructed directly', function(assert) {
            const drag = new joint.dia.LinkDrag(paper, link, { end: 'source' });
            assert.equal(drag.paper, paper);
            assert.equal(drag.linkView, link.findView(paper));
            assert.equal(drag.end, 'source');
            drag.cancel();
        });

        QUnit.test('throws unless given a link', function(assert) {
            assert.throws(() => paper.startLinkDrag(r1));
            assert.throws(() => paper.startLinkDrag(link.findView(paper)));
            assert.throws(() => paper.startLinkDrag(null));
            assert.notOk(graph.hasActiveBatch('arrowhead-move'));
            assert.notOk(graph.hasActiveBatch('add-link'));
        });

        QUnit.test('renders the view synchronously on an async paper', function(assert) {
            const asyncPaper = new joint.dia.Paper({
                el: $('<div/>').appendTo(fixtures.getElement()),
                model: graph,
                cellViewNamespace: joint.shapes,
                async: true,
                width: 400,
                height: 400
            });
            const added = newLink();
            const drag = asyncPaper.startLinkDrag(added);
            assert.ok(drag.linkView.el.isConnected);
            drag.finish(15, 15);
            assert.ok(graph.getCell(added.id));
            asyncPaper.remove();
        });
    });

    QUnit.module('link from a magnet', function() {

        QUnit.test('addLinkFromMagnet() + startLinkDrag() from an element', function(assert) {
            const r1View = r1.findView(paper);
            const linkView = r1View.addLinkFromMagnet(r1View.el, 50, 50);
            const drag = paper.startLinkDrag(linkView.model, { whenNotAllowed: 'remove' });
            drag.move(300, 300);
            drag.finish(300, 300);
            assert.equal(linkView.model.source().id, r1.id);
            assert.equal(linkView.model.target().id, r2.id);
        });

        QUnit.test('createLinkFromMagnet() + startLinkDrag() adds the link inside the "add-link" batch', function(assert) {
            const log = [];
            graph.on('batch:start', (data) => log.push('start:' + data.batchName));
            graph.on('batch:stop', (data) => log.push('stop:' + data.batchName));
            graph.on('add', () => log.push('add'));
            const r1View = r1.findView(paper);
            const created = r1View.createLinkFromMagnet(r1View.el, 50, 50);
            assert.notOk(created.graph, 'the link is not added to the graph');
            assert.equal(created.source().id, r1.id);
            assert.deepEqual(created.target(), { x: 50, y: 50 });
            const drag = paper.startLinkDrag(created);
            drag.move(300, 300);
            drag.finish(300, 300);
            assert.equal(created.target().id, r2.id);
            assert.deepEqual(
                log.filter((entry) => entry === 'add' || entry.endsWith(':add-link')),
                ['start:add-link', 'add', 'stop:add-link']
            );
        });

        QUnit.test('addLinkFromMagnet() + startLinkDrag() from a link', function(assert) {
            const linkView = link.findView(paper);
            const newLinkView = linkView.addLinkFromMagnet(linkView.el, 150, 150);
            const drag = paper.startLinkDrag(newLinkView.model);
            drag.move(300, 300);
            drag.finish(300, 300);
            assert.equal(newLinkView.model.source().id, link.id);
            assert.equal(newLinkView.model.target().id, r2.id);
        });
    });

    QUnit.module('external removal', function() {

        QUnit.test('removing the link deactivates the drag and unmarks available magnets', async function(assert) {
            paper.options.markAvailable = true;
            const drag = paper.startLinkDrag(link);
            assert.ok(HighlighterView.has(r2View), 'available magnets are marked');
            const promise = drag.followPointer();
            link.remove();
            assert.notOk(drag.isActive());
            assert.equal(HighlighterView.getAll(paper).length, 0);
            const { cancelled } = await promise;
            assert.ok(cancelled);
        });
    });

    QUnit.module('followPointer()', function() {

        QUnit.test('press-drag-release: finishes on pointerup', async function(assert) {
            const drag = paper.startLinkDrag(link);
            const promise = drag.followPointer();
            dispatchPointerEvent('pointermove', r2View.el, 300, 300);
            assert.deepEqual(link.target(), { x: 300, y: 300 });
            assert.ok(HighlighterView.has(r2View));
            assert.ok(drag.isActive());
            dispatchPointerEvent('pointerup', r2View.el, 300, 300);
            const result = await promise;
            assert.deepEqual(result, { cancelled: false, linkView: drag.linkView });
            assert.equal(link.target().id, r2.id);
            assert.notOk(drag.isActive());
        });

        QUnit.test('click-move-click: finishes on a primary pointerdown only', async function(assert) {
            const drag = paper.startLinkDrag(link);
            const promise = drag.followPointer({ finishOn: 'pointerdown' });
            dispatchPointerEvent('pointermove', r2View.el, 300, 300);
            dispatchPointerEvent('pointerup', r2View.el, 300, 300);
            assert.ok(drag.isActive(), 'pointerup does not finish the drag');
            dispatchPointerEvent('pointerdown', r2View.el, 300, 300, { button: 2 });
            assert.ok(drag.isActive(), 'a secondary button does not finish the drag');
            dispatchPointerEvent('pointerdown', r2View.el, 300, 300, { button: 0 });
            const { cancelled } = await promise;
            assert.notOk(cancelled);
            assert.equal(link.target().id, r2.id);
        });

        QUnit.test('Escape cancels', async function(assert) {
            const drag = paper.startLinkDrag(link);
            const promise = drag.followPointer();
            dispatchPointerEvent('pointermove', r2View.el, 300, 300);
            pressEscape();
            const { cancelled } = await promise;
            assert.ok(cancelled);
            assert.deepEqual(link.target(), { x: 150, y: 150 });
            assert.equal(HighlighterView.getAll(paper).length, 0);
        });

        QUnit.test('contextmenu cancels and is prevented', async function(assert) {
            const drag = paper.startLinkDrag(link);
            const promise = drag.followPointer({ finishOn: 'pointerdown' });
            dispatchPointerEvent('pointermove', r2View.el, 300, 300);
            const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
            const notPrevented = r2View.el.dispatchEvent(evt);
            assert.notOk(notPrevented, 'the native context menu is prevented');
            const { cancelled } = await promise;
            assert.ok(cancelled);
            assert.deepEqual(link.target(), { x: 150, y: 150 });
        });

        QUnit.test('cancel() resolves the pending promise', async function(assert) {
            const drag = paper.startLinkDrag(link);
            const promise = drag.followPointer();
            drag.cancel();
            const { cancelled } = await promise;
            assert.ok(cancelled);
        });

        QUnit.test('returns the same promise when called again and resolves at once when the drag is over', async function(assert) {
            const drag = paper.startLinkDrag(link);
            const promise = drag.followPointer();
            assert.equal(drag.followPointer(), promise);
            drag.finish(150, 150);
            assert.deepEqual(await drag.followPointer(), { cancelled: false, linkView: drag.linkView });
            const drag2 = paper.startLinkDrag(link);
            drag2.cancel();
            assert.ok((await drag2.followPointer()).cancelled);
        });

        QUnit.test('paper events are suspended while following and restored afterwards', function(assert) {
            const undelegateSpy = sinon.spy(paper, 'undelegateEvents');
            const delegateSpy = sinon.spy(paper, 'delegateEvents');
            const drag = paper.startLinkDrag(link);
            drag.followPointer();
            assert.ok(undelegateSpy.calledOnce);
            assert.notOk(delegateSpy.called);
            drag.cancel();
            assert.ok(delegateSpy.calledOnce);
            undelegateSpy.restore();
            delegateSpy.restore();
        });

        QUnit.test('removes its document listeners when the drag is over', function(assert) {
            const addSpy = sinon.spy(document, 'addEventListener');
            const removeSpy = sinon.spy(document, 'removeEventListener');
            const drag = paper.startLinkDrag(link);
            drag.followPointer();
            const added = addSpy.args.filter(([type]) => DOCUMENT_EVENT_TYPES.includes(type));
            assert.ok(added.length > 0);
            drag.finish(150, 150);
            added.forEach(([type, listener]) => {
                assert.ok(removeSpy.calledWith(type, listener), `${type} listener removed`);
            });
            addSpy.restore();
            removeSpy.restore();
        });
    });
});
