import { dia, g, shapes, setTheme, util } from '@joint/core';
import { createWorkerElk, layout } from '@joint/layout-elk';
import { graphJSON, createFileJSON, type FileKind } from './example';
import { Folder, FileTile, FOLDER_PADDING } from './shapes';
import './styles.scss';

import type {
    ElkLayoutOptions,
    ExportElementCallback,
    SetElementAttributesCallback
} from '@joint/layout-elk';

const cellNamespace = {
    ...shapes,
    example: {
        Folder,
        FileTile
    }
};

const TRANSITION_DURATION = 400;

const FILE_EXTENSIONS: Record<FileKind, string> = {
    photo: 'jpg',
    video: 'mp4',
    document: 'pdf',
    music: 'mp3',
    archive: 'zip'
};

// ELK runs in a Web Worker, so a layout doesn't block the page - the worker is started on
// the first layout, then shared by every later one.
const elk = createWorkerElk(() => new Worker(new URL('@joint/layout-elk/worker', import.meta.url), { type: 'module' }));

const init = () => {

    setTheme('material');

    const graph = new dia.Graph({}, { cellNamespace });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 900,
        height: 600,
        gridSize: 1,
        interactive: false,
        async: true,
        frozen: true
    });
    document.getElementById('canvas')!.appendChild(paper.el);

    graph.fromJSON(graphJSON);

    const controls = getControls();

    // The `rectpacking` options, read from the toolbar. ELK doesn't inherit
    // layout options down the hierarchy, so these go both on the root (to pack
    // the folders) and on every folder (to pack its files) - see `exportElement`.
    const getPackingOptions = (): ElkLayoutOptions => ({
        'elk.algorithm': 'rectpacking',
        'elk.aspectRatio': controls.aspectRatio.value as `${number}`,
        'elk.rectpacking.widthApproximation.optimizationGoal': controls.optimizationGoal.value,
        'elk.rectpacking.orderBySize': `${controls.orderBySize.checked}`
    });

    // Every folder is packed on its own (its size then fixed), before the root
    // packs the folders - `@joint/layout-elk`'s default `INCLUDE_CHILDREN` is meant
    // for edges crossing container boundaries, and `rectpacking` has no edges.
    const getRootOptions = (): ElkLayoutOptions => ({
        ...getPackingOptions(),
        'elk.hierarchyHandling': 'SEPARATE_CHILDREN',
        'elk.spacing.nodeNode': '20',
        'elk.padding': '[top=0,left=0,bottom=0,right=0]'
    });

    const exportElement: ExportElementCallback = ({ element, elkNode }) => {
        if (element instanceof Folder) {
            const { top, left, bottom, right } = FOLDER_PADDING;
            Object.assign(elkNode.layoutOptions, getPackingOptions(), {
                'elk.spacing.nodeNode': '6',
                'elk.padding': `[top=${top},left=${left},bottom=${bottom},right=${right}]`,
                // Applied to the files only, not to the root: stretching a folder
                // (already packed on its own) would just leave empty space inside it.
                'elk.rectpacking.whiteSpaceElimination.strategy': controls.whiteSpaceElimination.value
            });
            return;
        }
        // White space elimination stretches tiles - start every layout from the
        // tile's original size, not from whatever the previous layout made of it.
        const { width, height } = element.get('baseSize');
        elkNode.width = width;
        elkNode.height = height;
    };

    // `@joint/layout-elk` applies the ELK-computed size to containers only - a leaf
    // keeps its own size by default. Here ELK resizes tiles too (white space
    // elimination), so each tile takes `elkNode`'s size as well. Both are animated.
    const setElementAttributes: SetElementAttributesCallback = ({ element, attributes, elkNode }) => {
        const size = attributes.size ?? {
            width: elkNode.width ?? element.size().width,
            height: elkNode.height ?? element.size().height
        };
        transition(element, 'position', attributes.position);
        transition(element, 'size', size);
    };

    let contentArea = new g.Rect(0, 0, 0, 0);
    let zoomLevel = 1;

    const fit = () => {
        paper.scale(zoomLevel);
        paper.fitToContent({
            // Fit to the layout result itself - the elements are still mid-transition.
            contentArea,
            padding: 40 * zoomLevel,
            allowNewOrigin: 'any'
        });
    };

    // A change made while a layout is still running is not lost - one more
    // layout follows, with whatever the toolbar says by then.
    let running = false;
    let pending = false;
    const runLayout = async(): Promise<void> => {
        if (running) {
            pending = true;
            return;
        }
        running = true;
        do {
            pending = false;
            try {
                const { bbox } = await layout(graph, {
                    elk,
                    elkLayoutOptions: getRootOptions(),
                    exportElement,
                    setElementAttributes
                });
                contentArea = bbox;
                paper.unfreeze();
                fit();
            } catch (error) {
                // A failed layout doesn't drop a change made meanwhile - the loop goes on.
                paper.unfreeze();
                console.error('ELK layout error:', (error as Error).message);
            }
        } while (pending);
        running = false;
    };

    controls.aspectRatio.addEventListener('input', () => {
        controls.aspectRatioValue.textContent = Number(controls.aspectRatio.value).toFixed(1);
        runLayout();
    });
    controls.optimizationGoal.addEventListener('change', runLayout);
    controls.whiteSpaceElimination.addEventListener('change', runLayout);
    controls.orderBySize.addEventListener('change', runLayout);

    // `rectpacking` packs in model order (unless ordering by size) - so a new
    // order of the same files gives a different packing.
    document.getElementById('shuffle')!.addEventListener('click', () => {
        const folders = shuffle(graph.getElements().filter((element) => element instanceof Folder));
        const cells: dia.Cell[] = folders.flatMap((folder) => [folder, ...shuffle(folder.getEmbeddedCells())]);
        // The graph orders cells (and so `getEmbeddedCells()`) by `z` - a reset rebuilds
        // that order. Each folder still comes right before its own files.
        cells.forEach((cell, index) => cell.set('z', index + 1));
        graph.resetCells(cells);
        runLayout();
    });

    let fileCount = 0;
    document.getElementById('add-file')!.addEventListener('click', () => {
        const [folder] = shuffle(graph.getElements().filter((element) => element instanceof Folder));
        const kind: FileKind = folder.get('kind');
        const tile = new FileTile(createFileJSON(`${folder.id}`, kind, {
            name: `new-${++fileCount}.${FILE_EXTENSIONS[kind]}`,
            sizeMB: Math.round(10 + Math.random() * 150),
            ratio: [0.75, 1, 1.5, 1.8][Math.floor(Math.random() * 4)]
        }));
        // Appears at its folder's corner, then moves to wherever ELK packs it.
        tile.set({
            // A plain object - not the `g.Point` the getter returns, which the
            // transition below would otherwise mutate in place, without a change event.
            position: folder.position().toJSON(),
            z: graph.maxZIndex() + 1
        });
        graph.addCell(tile);
        runLayout();
    });

    document.getElementById('zoom-in')!.addEventListener('click', () => {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        fit();
    });

    document.getElementById('zoom-out')!.addEventListener('click', () => {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        fit();
    });

    runLayout();
};

function transition(element: dia.Element, path: 'position' | 'size', value: dia.Point | dia.Size): void {
    element.stopTransitions(path);
    element.transition(path, value, {
        duration: TRANSITION_DURATION,
        timingFunction: util.timing.cubic,
        valueFunction: util.interpolate.object
    });
}

function shuffle<T>(items: T[]): T[] {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function getControls() {
    return {
        optimizationGoal: document.getElementById('optimization-goal') as HTMLSelectElement,
        aspectRatio: document.getElementById('aspect-ratio') as HTMLInputElement,
        aspectRatioValue: document.getElementById('aspect-ratio-value') as HTMLSpanElement,
        whiteSpaceElimination: document.getElementById('white-space-elimination') as HTMLSelectElement,
        orderBySize: document.getElementById('order-by-size') as HTMLInputElement
    };
}

init();
