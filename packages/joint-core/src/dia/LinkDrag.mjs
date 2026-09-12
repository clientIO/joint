import { normalizeEvent } from '../util/util.mjs';

const POINTER_DOWN = 'pointerdown';
const POINTER_UP = 'pointerup';

// A handle for dragging one end of a link, created by `paper.startLinkDrag()`.
// The drag is active from the moment the handle is created: the caller either
// drives it (`move()`, `finish()`, `cancel()`) or hands it to the pointer
// (`followPointer()`).
export class LinkDrag {

    constructor(paper, link, opt = {}) {
        if (!link || typeof link.isLink !== 'function' || !link.isLink()) {
            throw new Error('dia.LinkDrag: expects a link.');
        }
        const graph = paper.model;
        const { end = 'target', whenNotAllowed: whenNotAllowedOption, ...batchData } = opt;
        let whenNotAllowed = whenNotAllowedOption;
        let batchName;
        if (link.graph === graph) {
            batchName = 'arrowhead-move';
            graph.startBatch(batchName, batchData);
        } else {
            batchName = 'add-link';
            whenNotAllowed = whenNotAllowed || 'remove';
            graph.startBatch(batchName, batchData);
            link.addTo(graph, { ui: true, async: false });
        }
        const linkView = paper.requireView(link);
        if (!linkView) {
            graph.stopBatch(batchName, batchData);
            throw new Error('dia.LinkDrag: could not find the view of the link.');
        }
        this.paper = paper;
        this.link = link;
        this.linkView = linkView;
        this.end = end;
        this._batchName = batchName;
        this._batchData = batchData;
        this._active = true;
        this._result = null;
        this._pointer = null;
        this._eventDataKey = `__${linkView.cid}__`;
        this._data = linkView.startArrowheadMove(end, {
            ignoreBackwardsCompatibility: true,
            whenNotAllowed
        });
        this._onLinkRemove = this._onLinkRemove.bind(this);
        link.on('remove', this._onLinkRemove);
    }

    isActive() {
        return this._active;
    }

    // move(evt) | move(evt, x, y) | move(x, y)
    move(...args) {
        if (!this._active) return;
        const [evt, localX, localY] = this._resolvePointer('pointermove', args);
        this.linkView.dragArrowhead(evt, localX, localY);
    }

    // finish(evt) | finish(evt, x, y) | finish(x, y)
    finish(...args) {
        if (!this._active) return;
        const [evt, localX, localY] = this._resolvePointer(POINTER_UP, args);
        this._deactivate();
        this.linkView.dragArrowheadEnd(evt, localX, localY);
        this._settle(false);
    }

    cancel() {
        if (!this._active) return;
        this._deactivate();
        this.linkView.cancelArrowheadMove(this._data);
        this._settle(true);
    }

    followPointer(opt = {}) {
        if (this._pointer) return this._pointer.promise;
        const pointer = {};
        pointer.promise = new Promise((resolve) => {
            pointer.resolve = resolve;
        });
        this._pointer = pointer;
        if (!this._active) {
            pointer.resolve(this._result);
            return pointer.promise;
        }
        const { finishOn = POINTER_UP } = opt;
        const finishEventType = (finishOn === POINTER_DOWN) ? POINTER_DOWN : POINTER_UP;
        const listeners = {
            pointermove: (evt) => this.move(evt),
            keydown: (evt) => {
                if (evt.key === 'Escape') this.cancel();
            },
            contextmenu: (evt) => {
                evt.preventDefault();
                this.cancel();
            },
            [finishEventType]: (evt) => {
                if (evt.button === 0) this.finish(evt);
            }
        };
        for (const type in listeners) {
            document.addEventListener(type, listeners[type]);
        }
        pointer.listeners = listeners;
        this.paper.undelegateEvents();
        return pointer.promise;
    }

    _resolvePointer(type, [evtOrX, xOrY, y]) {
        const { paper } = this;
        let evt;
        let localPoint;
        if (typeof evtOrX === 'number') {
            const clientPoint = paper.localToClientPoint(evtOrX, xOrY);
            evt = {
                type,
                clientX: clientPoint.x,
                clientY: clientPoint.y,
                target: document.elementFromPoint(clientPoint.x, clientPoint.y) || paper.el
            };
            localPoint = { x: evtOrX, y: xOrY };
        } else {
            evt = normalizeEvent(evtOrX);
            localPoint = (typeof xOrY === 'number')
                ? { x: xOrY, y }
                : paper.snapToGrid(evt.clientX, evt.clientY);
        }
        const data = evt.data || (evt.data = {});
        data[this._eventDataKey] = this._data;
        return [evt, localPoint.x, localPoint.y];
    }

    _onLinkRemove() {
        this._deactivate();
        this.linkView.cancelArrowheadMove(this._data);
        this._settle(true);
    }

    _deactivate() {
        this._active = false;
        this.link.off('remove', this._onLinkRemove);
    }

    _settle(cancelled) {
        const { paper, linkView, _batchName: batchName, _batchData: batchData, _pointer: pointer } = this;
        this._result = { cancelled, linkView };
        if (batchName) paper.model.stopBatch(batchName, batchData);
        if (pointer && pointer.listeners) {
            for (const type in pointer.listeners) {
                document.removeEventListener(type, pointer.listeners[type]);
            }
            pointer.listeners = null;
            paper.delegateEvents();
            pointer.resolve(this._result);
        }
    }
}
