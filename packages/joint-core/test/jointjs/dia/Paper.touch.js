QUnit.module('joint.dia.Paper touch gestures', function(hooks) {

    const Paper = joint.dia.Paper;

    const CLOCK_START = 1000000;
    // Touch identifiers and pointer ids are separate number spaces. Keeping them apart
    // here is what makes a test fail if the two are ever confused for each other.
    const POINTER_ID_BASE = 100;

    let fixtureEl;
    let paperEl;
    let graph;
    let paper;
    let element;
    let elementRect;
    let clock;
    let screen;

    // A touchscreen: dispatches, for every finger, the pointer event and then the
    // touch event a browser would, with the `touches` list of the whole screen.
    function createTouchScreen() {

        const active = [];

        function find(id) {
            const finger = active.find((finger) => finger.id === id);
            if (!finger) throw new Error(`No finger ${id} on the screen.`);
            return finger;
        }

        function touchList(fingers) {
            return fingers.map((finger) => new Touch({
                identifier: finger.id,
                target: finger.target,
                clientX: finger.x,
                clientY: finger.y,
                pageX: finger.x,
                pageY: finger.y,
            }));
        }

        function dispatchTouch(type, finger) {
            const evt = new TouchEvent(type, {
                bubbles: true,
                cancelable: true,
                touches: touchList(active),
                changedTouches: touchList([finger]),
                targetTouches: touchList(active.filter((other) => other.target === finger.target)),
            });
            finger.target.dispatchEvent(evt);
            return evt;
        }

        function dispatchPointer(type, finger) {
            const evt = new PointerEvent(type, {
                bubbles: true,
                cancelable: true,
                composed: true,
                pointerType: 'touch',
                pointerId: POINTER_ID_BASE + finger.id,
                isPrimary: finger.primary,
                clientX: finger.x,
                clientY: finger.y,
                screenX: finger.x,
                screenY: finger.y,
            });
            finger.target.dispatchEvent(evt);
            return evt;
        }

        return {
            down(id, target, x, y) {
                const finger = { id, target, x, y, primary: active.length === 0 };
                active.push(finger);
                const pointer = dispatchPointer('pointerdown', finger);
                const touch = dispatchTouch('touchstart', finger);
                return { pointer, touch };
            },
            move(id, x, y) {
                const finger = find(id);
                finger.x = x;
                finger.y = y;
                const pointer = finger.cancelled ? null : dispatchPointer('pointermove', finger);
                const touch = dispatchTouch('touchmove', finger);
                return { pointer, touch };
            },
            up(id) {
                const finger = find(id);
                const pointer = finger.cancelled ? null : dispatchPointer('pointerup', finger);
                active.splice(active.indexOf(finger), 1);
                const touch = dispatchTouch('touchend', finger);
                return { pointer, touch };
            },
            cancel(id) {
                const finger = find(id);
                const pointer = dispatchPointer('pointercancel', finger);
                active.splice(active.indexOf(finger), 1);
                const touch = dispatchTouch('touchcancel', finger);
                return { pointer, touch };
            },
            // The browser cancelled the pointer (a scroll): no pointer event follows, the
            // touch events of the finger are still delivered.
            cancelPointer(id) {
                const finger = find(id);
                finger.cancelled = true;
                return dispatchPointer('pointercancel', finger);
            },
            // The lifts were lost (the targets left the DOM): forget the fingers.
            forget() {
                active.length = 0;
            },
        };
    }

    // Records the paper events by name, with the type of the event object they carry.
    function recordEvents(names) {
        const record = {};
        names.forEach((name) => {
            record[name] = [];
            paper.on(name, function() {
                const evt = (name.startsWith('blank:') || name.startsWith('paper:')) ? arguments[0] : arguments[1];
                record[name].push(evt.type);
            });
        });
        return record;
    }

    function nextFrame() {
        return new Promise((resolve) => requestAnimationFrame(resolve));
    }

    function tap(target, x, y) {
        screen.down(1, target, x, y);
        return screen.up(1);
    }

    hooks.beforeEach(function() {

        fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        paperEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        fixtureEl.appendChild(paperEl);
        document.body.appendChild(fixtureEl);

        graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        paper = new Paper({ el: paperEl, model: graph, width: 400, height: 400 });

        element = new joint.shapes.standard.Rectangle();
        element.size(100, 100).position(50, 50).addTo(graph);
        elementRect = element.findView(paper).el.querySelector('rect');

        // The paper owns touch gestures only while a listener consumes them.
        paper.on('paper:pinch', function() {});

        screen = createTouchScreen();
        // `Date` drives the double-tap detection, the timeout the press delay. Animation
        // frames stay real: the paper captured `requestAnimationFrame` at load time.
        clock = sinon.useFakeTimers({ now: CLOCK_START, toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    });

    hooks.afterEach(function() {

        clock.restore();
        paper.remove();
        paper = graph = element = elementRect = paperEl = fixtureEl = null;
    });

    QUnit.module('single finger', function() {

        QUnit.test('a tap announces the press and releases it at the lift', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdown'], [], 'no press before the lift');

            screen.up(1);
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            assert.deepEqual(record['element:pointerup'], ['touchend'], 'released through the document events');
            assert.deepEqual(record['element:pointerclick'], ['click']);
            assert.notOk(graph.hasActiveBatch('pointer'), 'the pointer batch is closed');
        });

        QUnit.test('a held finger announces the press after TOUCH_PRESS_DELAY', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY - 1);
            assert.deepEqual(record['element:pointerdown'], []);

            clock.tick(1);
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            assert.ok(graph.hasActiveBatch('pointer'), 'the press opened the pointer batch');
            assert.deepEqual(record['element:pointerup'], []);

            screen.up(1);
            assert.deepEqual(record['element:pointerup'], ['touchend']);
            assert.deepEqual(record['element:pointerclick'], ['click']);
            assert.notOk(graph.hasActiveBatch('pointer'));
        });

        QUnit.test('a finger inside the threshold keeps its press withheld', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointermove', 'element:pointerup', 'element:pointerclick']);
            const wobble = paper.TOUCH_PRESS_THRESHOLD - 1;

            screen.down(1, elementRect, 100, 100);
            // The opening of a pinch looks exactly like this: a drifting first finger.
            screen.move(1, 100 + wobble, 100);
            assert.deepEqual(record['element:pointerdown'], [], 'a wobble announces nothing');
            assert.deepEqual(record['element:pointermove'], []);

            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the wait announces it');

            screen.move(1, 100 + wobble + 30, 100);
            assert.deepEqual(record['element:pointermove'], ['touchmove'], 'and the drag runs from there');

            screen.up(1);
            assert.deepEqual(record['element:pointerup'], ['touchend']);
            assert.deepEqual(record['element:pointerclick'], [], 'a drag is not a click');
            assert.notOk(graph.hasActiveBatch('pointer'));
        });

        QUnit.test('a finger past the threshold drags without waiting', function(assert) {

            const record = recordEvents(['element:pointerdown']);

            screen.down(1, elementRect, 100, 100);
            screen.move(1, 100 + paper.TOUCH_PRESS_THRESHOLD + 1, 100);
            // No `clock.tick`: a deliberate drag must not wait out the window.
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'announced by the travel');
            screen.up(1);
        });

        QUnit.test('the drag picks up where the finger is, not where it landed', function(assert) {

            const origin = element.position().toJSON();

            screen.down(1, elementRect, 100, 100);
            // The finger travels while the press is withheld.
            screen.move(1, 140, 100);
            assert.deepEqual(element.position().toJSON(), origin, 'nothing moved yet');

            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.move(1, 150, 100);
            // The element follows the finger from where the drag began. Measuring from
            // the landing point instead would jump it the whole 50px at once.
            assert.deepEqual(element.position().toJSON(), { x: origin.x + 10, y: origin.y });

            screen.move(1, 170, 100);
            assert.deepEqual(element.position().toJSON(), { x: origin.x + 30, y: origin.y });
            screen.up(1);
        });

        QUnit.test('a swipe released before the wait is over is not a click', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            screen.move(1, 100 + paper.TOUCH_PRESS_THRESHOLD, 100);
            screen.move(1, 160, 100);
            screen.up(1);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'announced at the lift');
            assert.deepEqual(record['element:pointerup'], ['touchend'], 'released through the document events');
            assert.deepEqual(record['element:pointerclick'], [], 'the finger travelled: a swipe, not a tap');
            assert.notOk(graph.hasActiveBatch('pointer'));
        });

        QUnit.test('a swipe is not a click under a clickThreshold of its own', function(assert) {

            // The press is announced only once the finger has travelled, so the distance
            // it covered while withheld is the part `clickThreshold` never sees.
            paper.options.clickThreshold = paper.TOUCH_PRESS_THRESHOLD;
            const record = recordEvents(['element:pointerdown', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            screen.move(1, 100 + paper.TOUCH_PRESS_THRESHOLD + 1, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the travel announced the press');

            screen.up(1);
            assert.deepEqual(record['element:pointerclick'], [], 'and the swipe is still not a tap');
        });

        QUnit.test('a guarded press hands the next finger its pointerdown back', function(assert) {

            const pointerEvents = [];
            elementRect.addEventListener('pointerdown', () => pointerEvents.push('pointerdown'));
            const record = recordEvents(['element:pointerdown']);
            // The paper wants nothing to do with this touch, so the content keeps it.
            paper.options.guard = () => true;

            screen.down(1, elementRect, 100, 100);
            assert.deepEqual(pointerEvents, ['pointerdown'], 'the guarded finger hears it at once');

            // The paper let the sequence go, so this finger starts nothing either - but
            // it must still reach the content it landed on.
            screen.down(2, elementRect, 200, 100);
            assert.deepEqual(pointerEvents, ['pointerdown', 'pointerdown'], 'and so does the one that follows');
            assert.deepEqual(record['element:pointerdown'], [], 'the paper announced neither');

            screen.up(2);
            screen.up(1);
        });

        QUnit.test('a finger on content next to the SVG leaves the first press to the next one', function(assert) {

            const overlay = document.createElement('div');
            paper.el.appendChild(overlay);
            const record = recordEvents(['element:pointerdown']);

            // A finger resting on a toolbar or a popup is not on the paper's event
            // surface, so the finger that follows is still the first one of a press.
            screen.down(1, overlay, 300, 300);
            screen.down(2, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the paper presses, it does not read two fingers');

            screen.up(2);
            screen.up(1);
        });

        QUnit.test('a cancelled finger announces nothing', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            screen.cancel(1);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:pointerdown'], []);
            assert.deepEqual(record['element:pointerup'], []);

            tap(elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the next tap works');
            assert.deepEqual(record['element:pointerclick'], ['click']);
        });

        QUnit.test('a guarded press announces nothing and the sequence is left alone', function(assert) {

            paper.options.guard = (evt) => evt.type === 'touchstart';
            const record = recordEvents(['element:pointerdown', 'blank:pointerdown', 'paper:pinch']);

            const { touch } = screen.down(1, elementRect, 100, 100);
            assert.notOk(touch.defaultPrevented, 'the browser keeps the touch');
            // A second finger is not a gesture of the paper either.
            const second = screen.down(2, elementRect, 200, 100);
            assert.notOk(second.touch.defaultPrevented);
            screen.move(2, 250, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.up(2);
            screen.up(1);

            assert.deepEqual(record['element:pointerdown'], []);
            assert.deepEqual(record['blank:pointerdown'], []);
        });

        QUnit.test('a tap is announced at the lift in a browser without pointer events', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            // Touch events only: the press is resolved by the `touchend`, not by a
            // preceding `pointerup`.
            const touch = { identifier: 1, target: elementRect, clientX: 100, clientY: 100 };
            const start = new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [new Touch(touch)], changedTouches: [new Touch(touch)] });
            elementRect.dispatchEvent(start);
            assert.deepEqual(record['element:pointerdown'], [], 'withheld');

            const end = new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [new Touch(touch)] });
            elementRect.dispatchEvent(end);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'announced by the lift');
            assert.deepEqual(record['element:pointerup'], ['touchend']);
            assert.deepEqual(record['element:pointerclick'], ['click']);
        });

        QUnit.test('a tap that wobbles within the threshold still clicks', function(assert) {

            const record = recordEvents(['element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            // A real finger never lands and lifts on the same pixel.
            screen.move(1, 100 + paper.TOUCH_PRESS_THRESHOLD - 1, 100);
            screen.up(1);
            assert.deepEqual(record['element:pointerclick'], ['click'], 'still a tap');
        });

        QUnit.test('a synthetic touchstart without touches takes the immediate path', function(assert) {

            const record = recordEvents(['element:pointerdown']);
            simulate.touchstart({ target: elementRect });
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            simulate.touchend({ target: elementRect });
        });
    });

    QUnit.module('two fingers', function() {

        QUnit.test('a drift that became a drag is undone by the second finger', function(assert) {

            // A magnet, so the drift is measured on the element a link could be dragged out of.
            element.attr(['body', 'magnet'], true);
            paper.options.defaultLink = () => new joint.shapes.standard.Link();
            const record = recordEvents(['element:pointerup', 'element:pointerclick']);
            const origin = element.position().toJSON();

            // The hand opens wider than the threshold before the second finger lands, so
            // the paper reads a drag. What matters is that the pinch undoes all of it.
            screen.down(1, elementRect, 100, 100);
            screen.move(1, 124, 108);
            screen.move(1, 150, 120);
            screen.down(2, elementRect, 260, 100);
            screen.move(1, 60, 100);
            screen.move(2, 300, 100);
            screen.up(2);
            screen.up(1);

            assert.deepEqual(element.position().toJSON(), origin, 'the element is back where it was');
            assert.equal(graph.getLinks().length, 0, 'and no link was left behind');
            assert.deepEqual(record['element:pointerclick'], [], 'and nothing was clicked');
            assert.notOk(graph.hasActiveBatch('pointer'));
        });

        QUnit.test('a second finger before the press is announced starts a gesture with no cell events', function(assert) {

            const record = recordEvents([
                'element:pointerdown', 'element:pointermove', 'element:pointerup', 'element:pointerclick', 'element:pointerdblclick',
                'blank:pointerdown', 'blank:pointerup', 'blank:pointerclick'
            ]);
            paper.on('paper:pinch', () => {});

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY - 1);
            const second = screen.down(2, elementRect, 200, 100);
            assert.ok(second.touch.defaultPrevented, 'the second finger is consumed');
            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.move(1, 80, 100);
            screen.move(2, 220, 100);
            screen.up(2);
            screen.up(1);

            Object.keys(record).forEach((name) => {
                assert.deepEqual(record[name], [], `${name} never fired`);
            });
            assert.notOk(graph.hasActiveBatch('pointer'));
            assert.deepEqual(element.position().toJSON(), { x: 50, y: 50 }, 'the element did not move');
        });

        QUnit.test('a second finger after the press was announced cancels the interaction without a click', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointermove', 'element:pointerup', 'element:pointerclick', 'blank:pointerup']);

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            assert.ok(graph.hasActiveBatch('pointer'));

            screen.down(2, elementRect, 200, 100);
            assert.deepEqual(record['element:pointerup'], ['touchcancel'], 'the press ends as a cancel');
            assert.deepEqual(record['blank:pointerup'], [], 'on the pressed view, not the blank area');
            assert.notOk(graph.hasActiveBatch('pointer'), 'the pointer batch is closed');

            screen.move(1, 80, 100);
            screen.move(2, 220, 100);
            screen.up(2);
            screen.up(1);
            assert.deepEqual(record['element:pointermove'], [], 'the drag is gone');
            assert.deepEqual(record['element:pointerup'], ['touchcancel'], 'no second release');
            assert.deepEqual(record['element:pointerclick'], [], 'and no click');
        });

        QUnit.test('a second finger during a drag cancels it and puts the element back', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointermove', 'element:pointerup', 'element:pointerclick']);
            const origin = element.position().toJSON();

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.move(1, 120, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            assert.deepEqual(element.position().toJSON(), { x: 70, y: 50 }, 'the drag moved it');

            screen.down(2, elementRect, 200, 100);
            assert.deepEqual(record['element:pointerup'], ['touchcancel']);
            screen.move(1, 150, 100);
            screen.move(2, 250, 100);
            screen.up(2);
            screen.up(1);
            assert.deepEqual(record['element:pointermove'], ['touchmove'], 'no move after the cancel');
            // A cancelled interaction was taken away, not completed: a pinch that began as
            // a drag must leave the element where the finger picked it up.
            assert.deepEqual(element.position().toJSON(), origin, 'the element is back where it started');
            assert.deepEqual(record['element:pointerclick'], []);
        });

        QUnit.test('a second finger during a link drag removes the link it created', function(assert) {

            // A column edge in a real app: a magnet a link can be dragged out of.
            element.attr(['body', 'magnet'], true);
            paper.options.defaultLink = () => new joint.shapes.standard.Link();
            const record = recordEvents(['element:magnet:pointerdown']);
            assert.equal(graph.getLinks().length, 0, 'no links to start with');

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:magnet:pointerdown'], ['touchstart'], 'the magnet was pressed');
            // The hand opens: the finger leaves the magnet and drags a new link out.
            screen.move(1, 130, 100);
            assert.equal(graph.getLinks().length, 1, 'the drag created a link');

            // The second finger turns the sequence into a pinch.
            screen.down(2, elementRect, 220, 100);
            screen.move(1, 60, 100);
            screen.move(2, 260, 100);
            screen.up(2);
            screen.up(1);
            // The link was never connected to anything: a cancelled drag leaves no trace.
            assert.equal(graph.getLinks().length, 0, 'the cancelled link is gone');
        });

        QUnit.test('a browser cancel puts a dragged element back too', function(assert) {

            const origin = element.position().toJSON();

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.move(1, 140, 120);
            assert.notDeepEqual(element.position().toJSON(), origin, 'the drag moved it');

            // The browser takes the finger (it starts scrolling the page).
            screen.cancelPointer(1);
            assert.deepEqual(element.position().toJSON(), origin, 'the element is back where it started');
            assert.notOk(graph.hasActiveBatch('pointer'));
            screen.up(1);
        });

        QUnit.test('a pinch fires paper:pinch once per frame with the relative scale at the midpoint', async function(assert) {

            const pinches = [];
            paper.on('paper:pinch', (evt, x, y, scale) => pinches.push({ type: evt.type, x, y, scale }));

            screen.down(1, elementRect, 10, 50);
            screen.down(2, elementRect, 110, 50);
            screen.move(1, 5, 50);
            screen.move(2, 155, 50);
            screen.move(1, 0, 50);
            screen.move(2, 200, 50);
            assert.deepEqual(pinches, [], 'coalesced until the frame');

            await nextFrame();
            const local = paper.clientToLocalPoint(100, 50);
            assert.deepEqual(pinches, [{ type: 'touchmove', x: local.x, y: local.y, scale: 2 }], 'one sample: 100 -> 200 apart');

            screen.move(2, 100, 50);
            await nextFrame();
            assert.equal(pinches.length, 2);
            assert.equal(pinches[1].scale, 0.5, 'relative to the previous sample');

            screen.up(1);
            screen.up(2);
        });

        QUnit.test('a two-finger pan fires paper:pan with wheel sign deltas', async function(assert) {

            const pans = [];
            const pinches = [];
            paper.on('paper:pan', (evt, deltaX, deltaY) => pans.push({ type: evt.type, deltaX, deltaY }));
            paper.on('paper:pinch', (evt, x, y, scale) => pinches.push(scale));

            screen.down(1, elementRect, 100, 100);
            screen.down(2, elementRect, 200, 100);
            // Both fingers move right by 30 and down by 10: the content follows them.
            screen.move(1, 130, 110);
            screen.move(2, 230, 110);
            await nextFrame();

            assert.deepEqual(pans, [{ type: 'touchmove', deltaX: -30, deltaY: -10 }]);
            assert.deepEqual(pinches, [], 'no pinch without a distance change');

            screen.up(1);
            screen.up(2);
        });

        QUnit.test('a lift delivers the pending sample at once', function(assert) {

            const pinches = [];
            paper.on('paper:pinch', (evt, x, y, scale) => pinches.push(scale));

            screen.down(1, elementRect, 0, 50);
            screen.down(2, elementRect, 100, 50);
            screen.move(2, 300, 50);
            screen.up(2);
            assert.deepEqual(pinches, [3], 'delivered by the lift, no frame needed');
            screen.up(1);
        });

        QUnit.test('without a listener every touch keeps the immediate path', function(assert) {

            paper.off('paper:pinch');
            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);
            const pointerEvents = [];
            elementRect.addEventListener('pointerdown', () => pointerEvents.push('pointerdown'));

            screen.down(1, elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'announced at once, as before');
            assert.deepEqual(pointerEvents, ['pointerdown'], 'the content hears the native press at once');
            screen.down(2, elementRect, 200, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart', 'touchstart'], 'the second finger is a press, as before');
            assert.deepEqual(pointerEvents, ['pointerdown', 'pointerdown']);
            screen.move(2, 220, 100);
            screen.up(2);
            screen.up(1);

            paper.on('paper:pan', () => {});
            screen.down(1, elementRect, 100, 100);
            const consumed = screen.down(2, elementRect, 200, 100);
            assert.ok(consumed.touch.defaultPrevented, 'a listener: the paper owns the gesture');
            assert.ok(screen.move(2, 220, 100).touch.defaultPrevented);
            assert.ok(screen.up(2).touch.defaultPrevented, 'the lift is prevented: no click, no mouse events');
            assert.ok(screen.up(1).touch.defaultPrevented);
            assert.deepEqual(record['element:pointerdown'], ['touchstart', 'touchstart'], 'nothing more announced');
            assert.deepEqual(record['element:pointerclick'], []);
        });

        QUnit.test('a second finger on content next to the SVG ends the press without a gesture', function(assert) {

            const overlay = document.createElement('div');
            paper.el.appendChild(overlay);
            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick', 'paper:pinch']);
            const overlayEvents = [];
            overlay.addEventListener('pointerdown', () => overlayEvents.push('pointerdown'));

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the press was announced');

            // A second finger on a toolbar or a popup is not the paper's, but the user is
            // no longer pressing the cell either.
            screen.down(2, overlay, 300, 300);
            assert.deepEqual(overlayEvents, ['pointerdown'], 'the overlay hears its finger at once');
            assert.deepEqual(record['element:pointerup'], ['touchcancel'], 'the press ends');
            assert.deepEqual(record['paper:pinch'], [], 'and no gesture begins');

            screen.up(2);
            screen.up(1);
            assert.deepEqual(record['element:pointerclick'], []);
            assert.notOk(graph.hasActiveBatch('pointer'));
        });

        QUnit.test('a cancelled gesture finger ends the gesture', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            screen.down(2, elementRect, 200, 100);
            screen.cancel(2);
            screen.cancel(1);
            assert.deepEqual(record['element:pointerdown'], []);

            tap(elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the next tap works');
            assert.deepEqual(record['element:pointerclick'], ['click']);
        });

        QUnit.test('a label press is cancelled by a second finger', function(assert) {

            const link = new joint.shapes.standard.Link({
                source: { x: 200, y: 300 },
                target: { x: 380, y: 300 },
                labels: [{ attrs: { text: { text: 'label' }}}]
            });
            link.addTo(graph);
            const labelNode = link.findView(paper).el.querySelector('.label');
            const record = recordEvents(['link:pointerdown', 'link:pointerup', 'link:pointerclick']);

            // A label press is announced at once (`onlabel` precedes `pointerdown`).
            screen.down(1, labelNode, 290, 300);
            assert.deepEqual(record['link:pointerdown'], ['touchstart']);
            screen.down(2, labelNode, 320, 300);
            assert.deepEqual(record['link:pointerup'], ['touchcancel'], 'ended as a cancel');
            screen.up(2);
            screen.up(1);
            assert.deepEqual(record['link:pointerup'], ['touchcancel']);
            assert.deepEqual(record['link:pointerclick'], []);
        });

        QUnit.test('a press consumed by a custom event handler has nothing to cancel', function(assert) {

            element.attr(['body', 'event'], 'element:press');
            paper.on('element:press', (view, evt) => evt.stopPropagation());
            const record = recordEvents(['element:press', 'element:pointerdown', 'blank:pointerup', 'element:pointerup']);

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:press'], ['touchstart']);
            assert.deepEqual(record['element:pointerdown'], [], 'the handler kept the press');
            screen.down(2, elementRect, 200, 100);
            screen.up(2);
            screen.up(1);
            assert.deepEqual(record['blank:pointerup'], [], 'no release for an interaction that never started');
            assert.deepEqual(record['element:pointerup'], []);
        });

        QUnit.test('a press whose cell left the graph announces nothing', function(assert) {

            const record = recordEvents(['element:pointerdown', 'blank:pointerdown']);

            screen.down(1, elementRect, 100, 100);
            element.remove();
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:pointerdown'], []);
            assert.deepEqual(record['blank:pointerdown'], []);
            screen.up(1);
        });

        QUnit.test('a mouse press keeps the immediate path', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup']);

            screen.down(1, elementRect, 100, 100);
            simulate.mousedown({ el: elementRect });
            assert.deepEqual(record['element:pointerdown'], ['mousedown'], 'the mouse is announced at once');
            simulate.mouseup({ el: elementRect });
            assert.deepEqual(record['element:pointerup'], ['mouseup']);
            screen.up(1);
        });

        QUnit.test('a gesture over the blank area announces no blank events', async function(assert) {

            const record = recordEvents(['blank:pointerdown', 'blank:pointermove', 'blank:pointerup', 'blank:pointerclick']);
            const pans = [];
            paper.on('paper:pan', (evt, deltaX, deltaY) => pans.push([deltaX, deltaY]));

            screen.down(1, paper.svg, 300, 300);
            screen.down(2, paper.svg, 350, 300);
            screen.move(1, 280, 300);
            screen.move(2, 330, 300);
            await nextFrame();
            screen.up(1);
            screen.up(2);

            Object.keys(record).forEach((name) => {
                assert.deepEqual(record[name], [], `${name} never fired`);
            });
            assert.deepEqual(pans, [[20, 0]]);
        });

        QUnit.test('a third finger is ignored', async function(assert) {

            const record = recordEvents(['element:pointerdown', 'blank:pointerdown']);
            const pinches = [];
            paper.on('paper:pinch', (evt, x, y, scale) => pinches.push(scale));

            screen.down(1, elementRect, 0, 50);
            screen.down(2, elementRect, 100, 50);
            const third = screen.down(3, paper.svg, 300, 300);
            assert.ok(third.touch.defaultPrevented);
            screen.move(3, 320, 300);
            screen.move(2, 200, 50);
            await nextFrame();
            assert.deepEqual(pinches, [2], 'the tracked pair drives the gesture');

            screen.up(3);
            screen.move(2, 100, 50);
            await nextFrame();
            assert.deepEqual(pinches, [2, 0.5], 'the gesture goes on after the third finger lifts');

            screen.up(1);
            screen.up(2);
            assert.deepEqual(record['element:pointerdown'], []);
            assert.deepEqual(record['blank:pointerdown'], []);
        });

        QUnit.test('the leftover finger after a gesture starts nothing', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerclick']);
            paper.on('paper:pinch', () => {});

            screen.down(1, elementRect, 100, 100);
            screen.down(2, elementRect, 200, 100);
            screen.up(2);
            const move = screen.move(1, 150, 150);
            assert.ok(move.touch.defaultPrevented, 'its moves are consumed');
            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.up(1);
            assert.deepEqual(record['element:pointerdown'], [], 'no press from the leftover finger');

            tap(elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the next tap works');
            assert.deepEqual(record['element:pointerclick'], ['click']);
        });

        QUnit.test('the lifts of a gesture are not a double tap', function(assert) {

            const record = recordEvents(['element:pointerdblclick']);

            screen.down(1, elementRect, 100, 100);
            screen.down(2, elementRect, 200, 100);
            clock.tick(50);
            screen.up(2);
            clock.tick(50);
            screen.up(1);
            assert.deepEqual(record['element:pointerdblclick'], [], 'the two lifts');

            clock.tick(100);
            tap(elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdblclick'], [], 'a tap right after the gesture');

            clock.tick(400);
            tap(elementRect, 100, 100);
            clock.tick(100);
            tap(elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdblclick'], ['dbltap'], 'a real double tap later');
        });

        QUnit.test('both fingers landing at once start a gesture', async function(assert) {

            const record = recordEvents(['element:pointerdown']);
            const pinches = [];
            paper.on('paper:pinch', (evt, x, y, scale) => pinches.push(scale));

            // One `touchstart` carrying both fingers.
            const touches = [
                new Touch({ identifier: 1, target: elementRect, clientX: 0, clientY: 50 }),
                new Touch({ identifier: 2, target: elementRect, clientX: 100, clientY: 50 }),
            ];
            elementRect.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches, changedTouches: touches, targetTouches: touches }));
            const moved = [touches[0], new Touch({ identifier: 2, target: elementRect, clientX: 200, clientY: 50 })];
            elementRect.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: moved, changedTouches: [moved[1]], targetTouches: moved }));
            await nextFrame();
            elementRect.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: moved, targetTouches: [] }));

            assert.deepEqual(record['element:pointerdown'], []);
            assert.deepEqual(pinches, [2]);
        });

        QUnit.test('a sequence whose lifts were lost is reset by the next fresh touch', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            screen.down(2, elementRect, 200, 100);
            screen.forget();

            tap(elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            assert.deepEqual(record['element:pointerclick'], ['click']);
        });
    });

    QUnit.module('native pointer events', function(hooks) {

        let pointerEvents;

        hooks.beforeEach(function() {
            pointerEvents = [];
            ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
                elementRect.addEventListener(type, (evt) => pointerEvents.push(`${type}:${evt.pointerId}:${evt.isTrusted}`));
            });
        });

        QUnit.test('content under the finger hears the pointerdown when the press is announced', function(assert) {

            const record = recordEvents(['element:pointerdown']);
            paper.on('element:pointerdown', () => pointerEvents.push('element:pointerdown'));

            screen.down(1, elementRect, 100, 100);
            assert.deepEqual(pointerEvents, [], 'withheld with the press');
            screen.move(1, 103, 100);
            assert.deepEqual(pointerEvents, [], 'its moves within the threshold too');

            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(pointerEvents, ['pointerdown:101:false', 'element:pointerdown'], 'the content hears it first, as it always did');

            screen.move(1, 110, 100);
            screen.up(1);
            assert.deepEqual(pointerEvents, ['pointerdown:101:false', 'element:pointerdown', 'pointermove:101:false', 'pointerup:101:false']);
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
        });

        QUnit.test('a tap delivers the pointerdown and the pointerup together', function(assert) {

            tap(elementRect, 100, 100);
            assert.deepEqual(pointerEvents, ['pointerdown:101:false', 'pointerup:101:false']);
        });

        QUnit.test('content under the fingers hears nothing during a gesture', function(assert) {

            paper.on('paper:pinch', () => {});
            screen.down(1, elementRect, 100, 100);
            screen.down(2, elementRect, 200, 100);
            screen.move(1, 90, 100);
            screen.move(2, 210, 100);
            screen.up(2);
            screen.move(1, 80, 100);
            screen.up(1);
            assert.deepEqual(pointerEvents, []);
        });

        QUnit.test('a delivered pointer still gets its pointerup when a gesture cancels the press', function(assert) {

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.down(2, elementRect, 200, 100);
            screen.move(1, 90, 100);
            screen.up(2);
            screen.up(1);
            assert.deepEqual(pointerEvents, ['pointerdown:101:false', 'pointerup:101:false']);
        });

        QUnit.test('a cancelled pointer ends the sequence: the browser took the finger', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            // The browser starts scrolling the page. It sends no `touchcancel` for that
            // (Chrome keeps delivering touch events), so this is the only notice.
            screen.cancelPointer(1);
            screen.move(1, 130, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            screen.up(1);
            assert.deepEqual(record['element:pointerdown'], [], 'nothing is announced');
            assert.deepEqual(pointerEvents, [], 'and the content hears nothing either');

            tap(elementRect, 100, 100);
            assert.deepEqual(record['element:pointerdown'], ['touchstart'], 'the next tap works');
            assert.deepEqual(record['element:pointerclick'], ['click']);
        });

        QUnit.test('a cancelled pointer ends an announced press the way a cancel does', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            assert.ok(graph.hasActiveBatch('pointer'));

            screen.cancelPointer(1);
            assert.deepEqual(record['element:pointerup'], ['pointercancel'], 'typed after its cause');
            assert.deepEqual(record['element:pointerclick'], []);
            assert.notOk(graph.hasActiveBatch('pointer'), 'the pointer batch is closed');
            screen.up(1);
        });

        QUnit.test('a guarded press is delivered to the content at once', function(assert) {

            paper.options.guard = (evt) => evt.type === 'touchstart';
            screen.down(1, elementRect, 100, 100);
            assert.deepEqual(pointerEvents, ['pointerdown:101:false'], 'with the touchstart, not later');
            screen.up(1);
            assert.deepEqual(pointerEvents, ['pointerdown:101:false', 'pointerup:101:false']);
        });

        QUnit.test('content next to the SVG is not withheld', function(assert) {

            const overlay = document.createElement('div');
            paper.el.appendChild(overlay);
            const events = [];
            overlay.addEventListener('pointerdown', () => events.push('pointerdown'));

            screen.down(1, overlay, 100, 100);
            assert.deepEqual(events, ['pointerdown']);
            screen.up(1);
        });
    });

    QUnit.module('cancelled pointers', function() {

        QUnit.test('a browser cancel reverts a drag on a paper that consumes no gestures', function(assert) {

            // No `paper:pinch` / `paper:pan` listener: the recognizer never engages, and
            // these are the semantics every existing paper gets.
            paper.off('paper:pinch');
            const origin = element.position().toJSON();

            simulate.touchstart({ target: elementRect });
            simulate.touchmove({ target: elementRect, clientX: 160, clientY: 140 });
            assert.notDeepEqual(element.position().toJSON(), origin, 'the drag moved it');

            simulate.touchevent({ type: 'touchcancel', target: elementRect });
            assert.deepEqual(element.position().toJSON(), origin, 'the cancel put it back');
        });

        QUnit.test('a cancelled drag restores the parent and the z-indices too', function(assert) {

            paper.options.embeddingMode = true;
            // Without this the drag is delegated to the parent and the child never moves.
            paper.options.interactive = { stopDelegation: true };
            const parent = new joint.shapes.standard.Rectangle();
            parent.size(400, 400).position(0, 0).addTo(graph);
            parent.embed(element);

            const origin = element.position().toJSON();
            const originalZ = element.attributes.z;

            screen.down(1, elementRect, 100, 100);
            clock.tick(paper.TOUCH_PRESS_DELAY);
            // Out of the parent: the drag unembeds it and brings it to the front.
            screen.move(1, 600, 600);
            assert.notEqual(element.parent(), parent.id, 'the drag detached it');

            screen.cancelPointer(1);
            assert.deepEqual(element.position().toJSON(), origin, 'the position is back');
            assert.equal(element.parent(), parent.id, 'and so is the parent');
            assert.equal(element.attributes.z, originalZ, 'and the z-index');
            screen.up(1);
        });

        QUnit.test('a touchcancel is not a click', function(assert) {

            const record = recordEvents(['element:pointerdown', 'element:pointerup', 'element:pointerclick']);

            simulate.touchstart({ target: elementRect });
            simulate.touchevent({ type: 'touchcancel', target: elementRect });
            assert.deepEqual(record['element:pointerdown'], ['touchstart']);
            assert.deepEqual(record['element:pointerup'], ['touchcancel']);
            assert.deepEqual(record['element:pointerclick'], []);
        });
    });

    QUnit.module('app-owned pinch detection', function() {

        // The technique MDN documents for pinch/zoom with pointer events: cache each
        // `pointerdown` by `pointerId`, update it on `pointermove`, and compare the
        // distance between the two cached pointers.
        // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
        function mdnPinchDetector(el) {
            const cache = [];
            const zooms = [];
            let previousDistance = -1;

            el.addEventListener('pointerdown', (evt) => cache.push(evt));
            el.addEventListener('pointermove', (evt) => {
                const index = cache.findIndex((cached) => cached.pointerId === evt.pointerId);
                if (index === -1) return;
                cache[index] = evt;
                if (cache.length !== 2) return;
                const distance = Math.hypot(
                    cache[0].clientX - cache[1].clientX,
                    cache[0].clientY - cache[1].clientY
                );
                if (previousDistance > 0) {
                    if (distance > previousDistance) zooms.push('in');
                    if (distance < previousDistance) zooms.push('out');
                }
                previousDistance = distance;
            });
            const onEnd = (evt) => {
                const index = cache.findIndex((cached) => cached.pointerId === evt.pointerId);
                if (index !== -1) cache.splice(index, 1);
                if (cache.length < 2) previousDistance = -1;
            };
            ['pointerup', 'pointercancel', 'pointerout', 'pointerleave'].forEach((type) => {
                el.addEventListener(type, onEnd);
            });
            return { cache, zooms };
        }

        function pinchTwoFingers() {
            screen.down(1, elementRect, 100, 100);
            screen.down(2, elementRect, 200, 100);
            screen.move(1, 80, 100);
            screen.move(2, 220, 100);
            screen.move(1, 60, 100);
            screen.move(2, 240, 100);
        }

        QUnit.test('a paper consuming no gesture leaves the pointer stream alone', function(assert) {

            // The fixture's listener is what makes the paper take the touches.
            paper.off('paper:pinch');
            const detector = mdnPinchDetector(paper.el);
            const record = recordEvents(['element:pointerdown']);

            pinchTwoFingers();
            assert.equal(detector.cache.length, 2, 'both pointers reached the app');
            // The pair is complete from the first move on, so every later one is a step.
            assert.deepEqual(detector.zooms, ['in', 'in', 'in'], 'and it recognized the pinch');

            screen.up(2);
            screen.up(1);
            assert.equal(detector.cache.length, 0, 'the app saw both lifts');
            assert.deepEqual(record['element:pointerdown'], ['touchstart', 'touchstart'],
                'and the paper announced each finger, as it does without a gesture listener');
        });

        QUnit.test('a paper consuming a gesture keeps the pointers of that gesture', async function(assert) {

            const detector = mdnPinchDetector(paper.el);
            const record = recordEvents(['paper:pinch', 'element:pointerdown']);

            pinchTwoFingers();
            await nextFrame();
            assert.equal(detector.cache.length, 0, 'the fingers of the gesture are the paper\'s');
            assert.ok(record['paper:pinch'].length > 0, 'and the paper reports the pinch');
            assert.deepEqual(record['element:pointerdown'], [], 'nothing under them was pressed');

            screen.up(2);
            screen.up(1);
        });
    });

    QUnit.test('remove() with a withheld press announces nothing afterwards', function(assert) {

        const record = recordEvents(['element:pointerdown', 'blank:pointerdown']);
        const spy = sinon.spy(paper.el, 'removeEventListener');

        screen.down(1, elementRect, 100, 100);
        paper.remove();
        clock.tick(paper.TOUCH_PRESS_DELAY);
        assert.deepEqual(record['element:pointerdown'], []);
        assert.deepEqual(record['blank:pointerdown'], []);
        const captureTypes = spy.args
            .filter((args) => args[2] && args[2].capture).map((args) => args[0]).sort();
        assert.deepEqual(captureTypes, [
            'gesturechange', 'gesturestart',
            'pointercancel', 'pointerdown', 'pointermove', 'pointerup',
            'touchcancel', 'touchend', 'touchmove', 'touchstart'
        ], 'every gesture listener is gone');
        // `afterEach` removes the paper again.
    });
});
