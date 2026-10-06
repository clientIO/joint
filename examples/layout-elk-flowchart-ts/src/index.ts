import { dia, elementTools, setTheme, util } from '@joint/core';
import {
    ElkLayoutOptions,
    ExportElementCallback,
    ExportPortCallback,
    SetPortAttributesCallback,
    layout
} from '@joint/layout-elk';
import { graphJSON } from './example';
import { Decision, FlowchartNode, FlowLink, Process, Terminal } from './shapes';
import './styles.scss';

const cellNamespace = {
    flowchart: { Process, Decision, Terminal, FlowLink }
};

// A "+" button - two of them, permanently shown on any `FlowchartNode` (a
// `Process`/`Decision` - not a `Terminal`, which stays a fixed entry/exit
// point): one just under the top border (`addInPort()`), one just above the
// bottom border (`addOutPort()`) - see the `render:done` handler below for
// how each one is positioned and which port group it grows.
class AddPortButton extends elementTools.Button {
    children = [
        { tagName: 'circle', selector: 'button', attributes: { r: 6, class: 'add-button' } },
        { tagName: 'path', selector: 'icon', attributes: { d: 'M -3 0 3 0 M 0 -3 0 3', class: 'add-button-icon' } }
    ];
}

const init = () => {

    // Every view (paper and cells alike) picks up a `joint-theme-material` class -
    // this example's own CSS gives that class its actual meaning (see `styles.scss`).
    setTheme('material');

    const graph = new dia.Graph({}, { cellNamespace });

    // A port is "free" - eligible both to start a new link from (an 'out'
    // port) and to drop one onto (an 'in' port) - only while nothing already
    // connects to it. Checked by exact port id, not just "does this element
    // have any free port", since a node can carry several of either group
    // (a `Decision`'s two branches, or any node grown via the "+" buttons).
    const isPortFree = (element: dia.Element, portId: string | null): boolean => {
        if (!portId) return false;
        return graph.getConnectedLinks(element).every((link) => {
            const source = link.source();
            const target = link.target();
            return !(source.id === element.id && source.port === portId) &&
                !(target.id === element.id && target.port === portId);
        });
    };

    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 1100,
        height: 750,
        gridSize: 1,
        async: true,
        frozen: true,
        defaultConnector: {
            name: 'straight',
            args: { cornerType: 'cubic', cornerRadius: 8 }
        },
        defaultConnectionPoint: { name: 'boundary' },
        // A plain, undecorated link isn't a `FlowLink` - but dragging a *free*
        // port to connect it to another one now needs a real link to drag, so
        // this is a `FlowLink` too, exactly like `element:magnet:pointerclick`'s
        // own new-step-and-link. It only ever actually gets added to the graph
        // on a valid drop, per `validateMagnet`/`validateConnection` below.
        defaultLink: () => new FlowLink(),
        // A link dragged from a magnet and dropped anywhere else (a blank
        // spot, or - critically - nowhere at all, i.e. a plain click with no
        // movement on a now-valid, *free* port) must not stick around
        // half-connected to a bare point - every `FlowLink` always connects
        // two actual ports, or doesn't exist. Without this, clicking a free
        // 'out' port (to spawn a new step, see `element:magnet:pointerclick`)
        // would *also* leave behind a second, dangling, nowhere-connected link
        // from that same click - `linkPinning`'s default (`true`) is what
        // otherwise keeps it "pinned" to that unconnected point instead of
        // discarding it.
        linkPinning: false,
        // A magnet only supports starting JointJS's own native drag-a-link
        // gesture (as opposed to just a *click*, see
        // `element:magnet:pointerclick` below) from a *free* 'out' port - the
        // source side of a new connection. Every other magnet (an 'in' port,
        // or any already-connected port) stays "passive" to it, same as if it
        // had no `magnet` attr at all for that purpose, and falls back to
        // plain element dragging instead - which doesn't take anything away
        // from reordering (`element:pointerdown` below).
        validateMagnet: (cellView, magnet) => {
            const element = cellView.model;
            if (!(element instanceof dia.Element)) return false;
            if (cellView.findAttribute('port-group', magnet) !== 'out') return false;
            return isPortFree(element, cellView.findAttribute('port', magnet));
        },
        // The other end of that new connection has to land on a *free* 'in'
        // port, on a *different* element - never back onto the same node
        // (a flowchart step never loops directly into itself).
        validateConnection: (cellViewS, _magnetS, cellViewT, magnetT, end) => {
            if (end !== 'target' || !magnetT || cellViewS === cellViewT) return false;
            const targetElement = cellViewT.model;
            if (!(targetElement instanceof dia.Element)) return false;
            if (cellViewT.findAttribute('port-group', magnetT) !== 'in') return false;
            return isPortFree(targetElement, cellViewT.findAttribute('port', magnetT));
        }
        // `interactive` stays at its default (`true`) - dragging an element is how
        // this example lets a user reorder it (see `element:pointerup` below); a
        // newly clicked-from port's new step starts out wherever, since ELK
        // repositions everything on the next layout pass regardless.
    });
    document.getElementById('canvas')!.appendChild(paper.el);
    addZoomAndPanListeners(paper);

    // A successful manual connection between two previously free ports -
    // re-lay out so ELK routes the new edge properly instead of leaving it
    // wherever the native drag happened to draw it.
    paper.on('link:connect', () => {
        runLayout();
    });

    // `order` is the model order ELK respects (see `elk.layered.considerModelOrder.strategy`
    // below) - `reorderAfter` reassigns it among siblings on drop, and `graph.getElements()`
    // needs to come back in that same sequence for it to have any effect, which means the
    // graph's cells (sorted by `z` - see `dia.CellCollection`'s `comparator`) need their `z`
    // kept in lockstep with it. Doing that here, once, reactively, means nothing that sets
    // `order` (below, and `reorderAfter`) ever also has to remember to update `z` itself.
    const ORDER_Z_OFFSET = 2;
    graph.on('change:order', (element: dia.Element, order: number) => {
        element.set('z', ORDER_Z_OFFSET + order);
    });

    graph.fromJSON(graphJSON);
    // Initial order: insertion order, i.e. `example.ts`'s own array order.
    graph.getElements().forEach((element, index) => element.set('order', index));

    const elkLayoutOptions: ElkLayoutOptions = {
        // Top-to-bottom flowchart.
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '48',
        'elk.layered.spacing.nodeNodeBetweenLayers': '68',
        'elk.edgeRouting': 'ORTHOGONAL',
        // Cycles are genuine here (see `example.ts`) - `MODEL_ORDER` always breaks
        // a cycle at the edge whose target was added before its source (a "back"
        // reference, by construction order), the same, deterministic way every
        // run - unlike a plain greedy search, which can just as easily reverse a
        // *forward* edge instead, leaving the graph's overall rank order confusing.
        'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
        // Keep new elements/links (added interactively, appended to the graph) from
        // being freely reshuffled among the existing ones wherever ELK's crossing
        // minimizer would otherwise put them - it still may reorder *ports* (see
        // `exportPort` below) to reduce crossings, just not the elements themselves.
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        // `considerModelOrder.strategy` above is only a preference crossing
        // minimization can still override wherever it believes another arrangement
        // has fewer crossings - which, for two siblings whose crossing count is the
        // same either way (a common case for two plain leaf branches), can silently
        // ignore the model order entirely. This makes it absolute instead, so the
        // reorder feature's `order` (via `z`) always actually has a visible effect.
        'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
        // Layers follow the nodes' current positions (passed to ELK in `exportElement`
        // below), so a re-layout after an edit keeps every existing step in the layer it
        // is already in, instead of re-ranking the whole flowchart from scratch.
        'elk.layered.layering.strategy': 'INTERACTIVE'
    };

    // `FIXED_SIDE` (not the package's default `FIXED_POS`) is what lets ELK reorder a
    // node's ports along their side to reduce crossings, instead of only routing edges
    // to wherever a port happens to already be.
    const exportElement: ExportElementCallback = ({ elkNode, element }) => {
        elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
        const position = element.position();
        elkNode.x = position.x;
        elkNode.y = position.y;
    };

    // Every 'in' port sits on the node's top, every 'out' port on its bottom -
    // matching the top-to-bottom flow and `FlowchartNode`'s own port groups.
    // `FIXED_SIDE` keeps each port on that side, while still letting ELK order
    // them along it.
    const exportPort: ExportPortCallback = ({ portId, element, elkPort }) => {
        elkPort.layoutOptions['elk.port.side'] = (element.getPort(portId).group === 'in') ? 'NORTH' : 'SOUTH';
    };

    // ELK (and the built-in 'top'/'bottom' port position functions) place a port
    // on the node's *bounding box* border - correct for `Process`/`Terminal`'s
    // rectangles, but not for `Decision`'s diamond, whose actual edge sits at
    // that same y for only one x (the tip). This projects the port back onto
    // the diamond's real slanted edge - only its y moves; x (which side, and
    // where along it) stays exactly what ELK computed.
    const setPortAttributes: SetPortAttributesCallback = ({ element, portId, attributes }) => {
        if (element instanceof Decision && attributes.position) {
            const { width, height } = element.size();
            const { x, y } = attributes.position.args;
            const distanceFromCenter = Math.abs(x - width / 2);
            const edgeY = distanceFromCenter / (width / 2) * (height / 2);
            attributes.position.args.y = (y < height / 2) ? edgeY : height - edgeY;
        }
        element.portProp(portId, attributes);
    };

    // Every edit (a new step, port or connection, a reorder) runs a new layout - one
    // made while an earlier layout is still running supersedes it: the earlier one is
    // aborted, so only the latest layout (which already includes every edit) is applied.
    let layoutController: AbortController | null = null;
    const runLayout = async(): Promise<void> => {
        layoutController?.abort();
        const controller = new AbortController();
        layoutController = controller;
        paper.freeze();
        try {
            await layout({ graph }, {
                exportElement,
                exportPort,
                setPortAttributes,
                elkLayoutOptions,
                signal: controller.signal
            });
        } catch (error) {
            // Superseded - the layout that aborted it unfreezes the paper once it's done.
            if (controller.signal.aborted) return;
            console.error('ELK layout error:', (error as Error).message);
        }
        paper.unfreeze();
        // Refit the paper to the new layout, keeping the current zoom level.
        zoom(paper, paper.scale().sx);
    };

    runLayout();

    // "+" buttons - two per `FlowchartNode`, always shown (not just on hover).
    // `render:done` fires after every render pass - initial load, and every
    // re-layout/new-element pass alike - so this both covers the initial set
    // of elements and keeps picking up any added afterwards; `hasTools()`
    // makes it idempotent, since the same view's `render:done` fires again
    // on every later pass too. `x`/`y` position each button relative to the
    // element's own (current) bbox top-left corner - a fixed inset down from
    // the top border for the 'in' button, and, since node height varies
    // (`Decision` vs `Process`/`Terminal`), a percentage-of-height position
    // (`'100%'`, the bottom border) plus a negative pixel `offset` for the
    // 'out' button, so it always ends up the same fixed inset *up* from
    // whatever the bottom border actually is.
    const ADD_BUTTON_INSET = 20;
    paper.on('render:done', () => {
        graph.getElements().forEach((element) => {
            if (!(element instanceof FlowchartNode)) return;
            const elementView = paper.findViewByModel(element);
            if (!elementView || elementView.hasTools()) return;
            elementView.addTools(new dia.ToolsView({
                tools: [
                    new AddPortButton({
                        x: '50%',
                        y: ADD_BUTTON_INSET,
                        action: () => {
                            element.addInPort();
                            runLayout();
                        }
                    }),
                    new AddPortButton({
                        x: '50%',
                        y: '100%',
                        offset: { y: -ADD_BUTTON_INSET },
                        action: () => {
                            element.addOutPort();
                            runLayout();
                        }
                    })
                ]
            }));
        });
    });

    // Click a port to grow the flowchart from it: a new step, connected from that
    // port - only 'out' ports make sense as a starting point for a new downstream
    // step. Prompts for the new step's label; leaving it blank falls back to an
    // auto-numbered one.
    let newStepCount = 0;
    paper.on('element:magnet:pointerclick', (elementView: dia.ElementView, evt: dia.Event, magnet: SVGElement) => {
        const element = elementView.model;
        const portId = elementView.findAttribute('port', magnet);
        const portGroup = elementView.findAttribute('port-group', magnet);
        if (!portId || portGroup !== 'out') return;

        newStepCount++;
        const label = window.prompt('New step name:', `Step ${newStepCount}`) || `Step ${newStepCount}`;

        // Appended at the end of the model order - set directly (not via `.set()`
        // afterwards) since a constructor's initial attributes don't trigger
        // `change:order`, so `z` needs setting alongside it here, just this once.
        const order = graph.getElements().length;
        const newStep = new Process({
            position: element.position(),
            attrs: { label: { text: label } },
            ports: { items: [{ group: 'in' }, { group: 'out' }] },
            order,
            z: ORDER_Z_OFFSET + order
        });
        const newLink = new FlowLink({
            source: { id: element.id, port: portId },
            target: { id: newStep.id }
        });
        graph.addCells([newStep, newLink]);

        runLayout();
    });

    // Drag an element onto another one to reorder it - only among actual
    // *siblings*, i.e. the other elements ELK placed in the same *layer* of
    // this top-to-bottom layout - approximated here by comparing each
    // element's current *y*, since a layered layout always aligns every
    // element of one layer to the same y regardless of its own height (see
    // `LAYER_Y_EPSILON`). This is deliberately about the *layout*, not the
    // graph's parent/child structure: e.g. "Active?" (`checkAccountStatus`)
    // and "Show Error" don't share a single parent - a cycle also feeds
    // "Active?" from "Session Error", so it has two - but they DO sit in the
    // same layer, and reordering them relative to each other is exactly what
    // dragging one onto the other should do. An element alone in its own
    // layer (nothing else at a matching y - true of `Start`/`End`, always
    // alone at the very first/last rank) has nothing to reorder against, so
    // `element:pointerdown` leaves it to drag natively, with no preview and
    // no reorder on drop (same as a plain click).
    //
    // Nothing in the graph itself moves during the drag - not the dragged
    // element (`preventDefaultInteraction` stops its own native move), not
    // any sibling either. A cloned, semitransparent copy of the dragged
    // element is what actually follows the pointer - horizontally only,
    // reordering being a left-right rearrangement among siblings that all
    // sit at the same rank - appended directly to the paper's front layer,
    // outside the graph entirely. Only the actual drop (`element:pointerup`)
    // touches the model at all: it compares the drop position against every
    // sibling's own (real, never moved) position to work out the new order,
    // then a real, full ELK `layout()` runs.
    const LAYER_Y_EPSILON = 1;
    let draggedElement: dia.Element | null = null;
    let draggedSiblings: dia.Element[] | null = null;
    let draggedBBox: dia.BBox | null = null;
    let previewNode: SVGElement | null = null;

    const clearPreview = (): void => {
        previewNode?.remove();
        previewNode = null;
    };

    paper.on('element:pointerdown', (elementView: dia.ElementView, evt: dia.Event) => {
        const element = elementView.model;
        // Always prevent JointJS's own native move, reorderable or not - an
        // element with no siblings (e.g. `Start`/`End`) would otherwise still
        // be freely draggable around the canvas by default, just with no
        // preview and no effect on drop. Blocking the native move outright
        // means it's simply not possible to move it around in the first place.
        elementView.preventDefaultInteraction(evt);

        const y = element.position().y;
        const siblings = graph.getElements().filter((el) => (
            el !== element && Math.abs(el.position().y - y) < LAYER_Y_EPSILON
        ));
        if (siblings.length === 0) return;

        draggedElement = element;
        draggedSiblings = siblings;
        draggedBBox = element.getBBox().toJSON();

        previewNode = elementView.el.cloneNode(true) as SVGElement;
        previewNode.setAttribute('class', `${previewNode.getAttribute('class') || ''} drag-preview`);
        previewNode.setAttribute('transform', `translate(${draggedBBox.x}, ${draggedBBox.y})`);
        paper.getLayerView(dia.Paper.Layers.FRONT).el.appendChild(previewNode);
    });

    paper.on('element:pointermove', (elementView: dia.ElementView, _evt: dia.Event, x: number) => {
        if (elementView.model !== draggedElement || !previewNode || !draggedBBox) return;
        previewNode.setAttribute('transform', `translate(${x - draggedBBox.width / 2}, ${draggedBBox.y})`);
    });

    paper.on('element:pointerup', (elementView: dia.ElementView, _evt: dia.Event, x: number) => {
        // Only a drop that actually changes the order needs a new layout - not a plain
        // click, nor a drop back where the element already was.
        const isReordered = (elementView.model === draggedElement && draggedSiblings)
            ? reorderAmongSiblings(elementView.model, draggedSiblings, x)
            : false;
        clearPreview();

        draggedElement = null;
        draggedSiblings = null;
        draggedBBox = null;

        if (isReordered) runLayout();
    });
};

// Reassigns `element`'s `order` attribute among `siblings` (the other
// elements in its current layer), based on where it was dropped (`dropX`,
// its would-be center) - every sibling sorts by its own real bbox center
// instead, since none of them ever actually moved during the drag. Only the
// group's own, already-assigned `order` values are reused, permuted into the
// new sequence - not reassigned from scratch - so no element outside the
// group (with its own unrelated `order` value) is ever touched by a reorder
// that's supposed to be purely local to this layer. `z` (hence
// `graph.getElements()`'s own order, hence `exportGraph`, hence
// `considerModelOrder.strategy`) follows automatically, via the
// `change:order` listener registered in `init()`. Returns whether any element's
// `order` changed.
function reorderAmongSiblings(element: dia.Element, siblings: dia.Element[], dropX: number): boolean {
    const group = [element, ...siblings];
    const orderValues: number[] = group.map((el) => el.get('order')).sort((a, b) => a - b);
    const sorted = util.sortBy(group, (el) => (el === element) ? dropX : el.getBBox().center().x);
    let isChanged = false;
    sorted.forEach((el, i) => {
        if (el.get('order') === orderValues[i]) return;
        el.set('order', orderValues[i]);
        isChanged = true;
    });
    return isChanged;
}

function zoom(paper: dia.Paper, zoomLevel: number): void {
    paper.scale(zoomLevel);
    paper.fitToContent({
        useModelGeometry: true,
        padding: 40 * zoomLevel,
        allowNewOrigin: 'any'
    });
}

/**
 * Add toolbar zoom in/out listeners to the paper and setup panning.
 */
function addZoomAndPanListeners(paper: dia.Paper): void {

    let zoomLevel = paper.scale().sx;

    document.getElementById('zoom-in')!.addEventListener('click', () => {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        zoom(paper, zoomLevel);
    });

    document.getElementById('zoom-out')!.addEventListener('click', () => {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        zoom(paper, zoomLevel);
    });

    paper.on('blank:pointerdown', (evt) => {
        evt.data = {
            scrollX: window.scrollX,
            clientX: evt.clientX,
            scrollY: window.scrollY,
            clientY: evt.clientY
        };
    });

    paper.on('blank:pointermove', (evt) => {
        window.scroll(
            evt.data.scrollX + (evt.data.clientX - evt.clientX!),
            evt.data.scrollY + (evt.data.clientY - evt.clientY!)
        );
    });
}

init();
