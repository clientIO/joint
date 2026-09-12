import { normalizeEvent } from '../util/util.mjs';

const POINTER_DOWN = 'pointerdown';
const POINTER_UP = 'pointerup';

// A handle for dragging one end of a link, created by `paper.startLinkDrag()`.
// The drag is active from the moment the handle is created: the caller either
// drives it (`move()`, `finish()`, `cancel()`) or hands it to the pointer
// (`followPointer()`).
export class LinkDrag {

    constructor(paper, linkView, opt = {}) {
        const { end = 'target', whenNotAllowed, batchName = null } = opt;
        this.paper = paper;
        this.linkView = linkView;
        this.link = linkView.model;
        this.end = end;
        this._batchName = batchName;
        this._active = true;
        this._result = null;
        this._pointer = null;
        this._eventDataKey = `__${linkView.cid}__`;
        this._data = linkView.startArrowheadMove(end, {
            ignoreBackwardsCompatibility: true,
            whenNotAllowed
        });
        this._onLinkRemove = this._onLinkRemove.bind(this);
        this.link.on('remove', this._onLinkRemove);
    }

    isActive() {
        return this._active;
    }

    move(x, y) {
        if (!this._active) return;
        const [evt, localX, localY] = this._resolvePointer('pointermove', x, y);
        this.linkView.dragArrowhead(evt, localX, localY);
    }

    finish(x, y) {
        if (!this._active) return;
        const [evt, localX, localY] = this._resolvePointer(POINTER_UP, x, y);
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

    _resolvePointer(type, x, y) {
        const { paper } = this;
        let evt;
        let localPoint;
        if (typeof x === 'number') {
            const clientPoint = paper.localToClientPoint(x, y);
            evt = {
                type,
                clientX: clientPoint.x,
                clientY: clientPoint.y,
                target: document.elementFromPoint(clientPoint.x, clientPoint.y) || paper.el
            };
            localPoint = { x, y };
        } else {
            evt = normalizeEvent(x);
            localPoint = paper.snapToGrid(evt.clientX, evt.clientY);
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
        const { paper, linkView, _batchName: batchName, _pointer: pointer } = this;
        this._result = { cancelled, linkView };
        if (batchName) paper.model.stopBatch(batchName);
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
