import { normalizeEvent } from '../util/util.mjs';
import { CELL_MARKER } from './symbols.mjs';

const POINTER_DOWN = 'pointerdown';
const POINTER_UP = 'pointerup';
const CONNECTION = 'connection';

const isPrimary = (evt, type) => evt.type === type && evt.button === 0;

const finishPredicates = {
    [POINTER_UP]: (evt) => isPrimary(evt, POINTER_UP),
    [POINTER_DOWN]: (evt) => isPrimary(evt, POINTER_DOWN),
    [CONNECTION]: (evt, drag) => isPrimary(evt, POINTER_DOWN) && drag.getConnectionCandidate() !== null
};

/**
 * @class
 * @description A handle for dragging one end of a link. The drag is active
 * from the moment the handle is created: the caller either drives it with
 * `move()`, `finish()` and `cancel()`, or hands it to the pointer with
 * `followPointer()`. Usually created via `paper.startLinkDrag()`.
 */
export class LinkDrag {

    /**
     * @param {dia.Paper} paper - The paper the link is (or will be) rendered in.
     * @param {dia.Link} link - The link to drag. A link that is not in the paper's
     * graph yet is added to it inside an `add-link` batch; a link already in the
     * graph is dragged inside an `arrowhead-move` batch.
     * @param {Object} [opt]
     * @param {'source'|'target'} [opt.end='target'] - The end of the link to drag.
     * @param {'revert'|'remove'} [opt.whenNotAllowed] - What to do with the link
     * when the drag is cancelled or the new connection is not allowed. Defaults to
     * `'remove'` for a link added by the handle and to `'revert'` otherwise.
     * @param {...*} [opt.*] - Any other option is passed as the batch data
     * (e.g. `{ ui: true, tool: cid }`).
     * @throws {Error} if `link` is not a `dia.Link`
     * @throws {Error} if the view of the link cannot be found in the paper
     */
    constructor(paper, link, opt = {}) {
        if (!link || !link[CELL_MARKER] || !link.isLink()) {
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
        this._data = linkView.startArrowheadMove(end, {
            ignoreBackwardsCompatibility: true,
            whenNotAllowed
        });
        this._onLinkRemove = this._onLinkRemove.bind(this);
        link.on('remove', this._onLinkRemove);
    }

    /**
     * @public
     * @description Checks whether the drag is still in progress.
     * @return {boolean} `false` once `finish()` or `cancel()` ran or the link was removed.
     */
    isActive() {
        return this._active;
    }

    /**
     * @public
     * @description Moves the dragged end. Highlights the magnet under the point
     * and, with `snapLinks` enabled, snaps to the closest one. Accepts a pointer
     * event (`move(evt)`; the point is taken from the client coordinates and
     * snapped to the grid), an event with explicit paper local coordinates
     * (`move(evt, x, y)`) or local coordinates only (`move(x, y)`; the element
     * under the point is looked up in the document).
     * @param {Event|number} evtOrX - The pointer event or the local x coordinate.
     * @param {number} [xOrY] - The local x coordinate (with an event) or the local y coordinate.
     * @param {number} [y] - The local y coordinate (with an event).
     */
    move(...args) {
        if (!this._active) return;
        const [evt, localX, localY] = this._resolvePointer('pointermove', args);
        this.linkView.updateArrowheadMove(this._data, evt, localX, localY);
    }

    /**
     * @public
     * @description Ends the drag at the given point: connects the end to the
     * magnet under it (or leaves it at the point), validates the link and reverts
     * or removes it when not allowed, triggers `link:connect` / `link:disconnect`
     * and restores the link. Same argument forms as `move()`. No-op when the drag
     * is not active.
     * @param {Event|number} evtOrX - The pointer event or the local x coordinate.
     * @param {number} [xOrY] - The local x coordinate (with an event) or the local y coordinate.
     * @param {number} [y] - The local y coordinate (with an event).
     */
    finish(...args) {
        if (!this._active) return;
        const [evt, localX, localY] = this._resolvePointer(POINTER_UP, args);
        this._deactivate();
        this.linkView.finishArrowheadMove(this._data, evt, localX, localY);
        this._settle(false);
    }

    /**
     * @public
     * @description Returns the magnet the end would connect to if the drag
     * finished now: the magnet under the last point (or the closest one with
     * `snapLinks`), provided `validateConnection` accepted it.
     * @return {{ cellView: dia.CellView, magnet: SVGElement }|null} `null` when
     * there is no valid magnet or the drag is over.
     */
    getConnectionCandidate() {
        if (!this._active) return null;
        const { closestView, closestMagnet, viewUnderPointer, magnetUnderPointer } = this._data;
        if (closestView && closestMagnet) {
            return { cellView: closestView, magnet: closestMagnet };
        }
        if (viewUnderPointer && magnetUnderPointer) {
            return { cellView: viewUnderPointer, magnet: magnetUnderPointer };
        }
        return null;
    }

    /**
     * @public
     * @description Aborts the drag: removes the highlighters, restores the link
     * and puts the end back where it was (or removes the link, depending on
     * `whenNotAllowed`). No `link:connect` / `link:disconnect` is triggered.
     * No-op when the drag is not active.
     */
    cancel() {
        if (!this._active) return;
        this._deactivate();
        this.linkView.cancelArrowheadMove(this._data);
        this._settle(true);
    }

    /**
     * @public
     * @description Lets the pointer drive the drag. Listens on the document for
     * `pointermove` (moves the end), `pointerdown` / `pointerup` (finish the drag
     * according to `finishOn`), the Escape key and `contextmenu` (both cancel;
     * the native context menu is prevented). The paper's own pointer events are
     * suspended in the meantime. Calling it again returns the same promise; on a
     * finished drag it resolves at once. To keep receiving the events when the
     * pointer leaves the window or enters an iframe, capture the pointer in the
     * handler that starts the drag (`evt.target.setPointerCapture(evt.pointerId)`);
     * captured events are handled.
     * @param {Object} [opt]
     * @param {'pointerup'|'pointerdown'|'connection'|function(Event, dia.LinkDrag): boolean} [opt.finishOn='pointerup']
     * When the drag finishes: `'pointerup'` - the primary button is released
     * (press-drag-release); `'pointerdown'` - the primary button is pressed
     * (click-move-click); `'connection'` - the primary button is pressed over a
     * valid magnet (see `getConnectionCandidate()`), other clicks are ignored;
     * a function - called with every `pointerdown` and `pointerup` event and the
     * handle, finishes when it returns `true`.
     * @return {Promise<{ cancelled: boolean, linkView: dia.LinkView }>} Resolved
     * when the drag is over, whichever way it ended (`finish()`, `cancel()`, the
     * pointer, the keyboard or the removal of the link).
     */
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
        const shouldFinish = (typeof finishOn === 'function') ? finishOn : finishPredicates[finishOn];
        if (!shouldFinish) {
            throw new Error(`dia.LinkDrag: unknown finishOn value "${finishOn}".`);
        }
        const onFinishCandidate = (evt) => {
            // Update the end and the connection candidate to the event position first.
            this.move(evt);
            if (this._active && shouldFinish(evt, this)) this.finish(evt);
        };
        const listeners = {
            pointermove: (evt) => this.move(evt),
            pointerdown: onFinishCandidate,
            pointerup: onFinishCandidate,
            keydown: (evt) => {
                if (evt.key === 'Escape') this.cancel();
            },
            contextmenu: (evt) => {
                evt.preventDefault();
                this.cancel();
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
