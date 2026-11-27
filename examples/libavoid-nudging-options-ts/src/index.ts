import '../styles.scss';
import { dia, shapes } from '@joint/core';
import { AvoidLib } from 'libavoid-js';
import { NudgingRouter, NudgingOptions } from './routing';
import { createCells } from './scenes';

type OptionName = keyof NudgingOptions;

/** What `@joint/router-avoid` sets: the first two on, the third off. */
const ROUTER_AVOID_OPTIONS: NudgingOptions = { ends: true, sharedPaths: true, touchingColinear: false };
const ALL_OFF: NudgingOptions = { ends: false, sharedPaths: false, touchingColinear: false };

// `?ends=1&sharedPaths=0&touchingColinear=0` opens the example with these options.
const params = new URLSearchParams(location.search);
const options: NudgingOptions = {
    ends: params.get('ends') === '1',
    sharedPaths: params.get('sharedPaths') === '1',
    touchingColinear: params.get('touchingColinear') === '1',
};

const graph = new dia.Graph({}, { cellNamespace: shapes });
new dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    cellViewNamespace: shapes,
    width: 1180,
    height: 740,
    gridSize: 10,
    drawGrid: true,
    async: true,
    background: { color: '#F3F7F6' },
    interactive: { linkMove: false, labelMove: false, addLinkFromMagnet: false },
    defaultConnectionPoint: { name: 'anchor' },
});
graph.resetCells(createCells());

const toggles = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-option]'));
const presets: Array<[HTMLButtonElement, NudgingOptions]> = [
    [document.querySelector<HTMLButtonElement>('#preset-off'), ALL_OFF],
    [document.querySelector<HTMLButtonElement>('#preset-router-avoid'), ROUTER_AVOID_OPTIONS],
];
const status = document.getElementById('status');

function isOptionName(value: string): value is OptionName {
    return Object.prototype.hasOwnProperty.call(ALL_OFF, value);
}

// The routing needs the libavoid WASM module, so the controls work once it is loaded.
AvoidLib.load().then(() => {
    const router = new NudgingRouter(graph, options);

    function route(): void {
        const endsOffPort = router.route();
        status.textContent = `${endsOffPort} link ${endsOffPort === 1 ? 'end' : 'ends'} not attached to the center of the port`;
    }

    function applyOptions(): void {
        toggles.forEach((button) => {
            const { option } = button.dataset;
            if (!isOptionName(option)) return;
            button.setAttribute('aria-pressed', String(options[option]));
            button.querySelector('.state').textContent = options[option] ? 'ON' : 'OFF';
        });
        router.setOptions(options);
        route();
    }

    toggles.forEach((button) => {
        button.addEventListener('click', () => {
            const { option } = button.dataset;
            if (!isOptionName(option)) return;
            options[option] = !options[option];
            applyOptions();
        });
    });
    presets.forEach(([button, values]) => {
        button.addEventListener('click', () => {
            Object.assign(options, values);
            applyOptions();
        });
    });
    [...toggles, ...presets.map(([button]) => button)].forEach((button) => {
        button.disabled = false;
    });

    // Moves the dragged elements and routes again, at most once per frame.
    const movedElements = new Set<dia.Element>();
    let routeFrameId = 0;
    graph.on('change:position', (element: dia.Element) => {
        movedElements.add(element);
        if (routeFrameId) return;
        routeFrameId = requestAnimationFrame(() => {
            routeFrameId = 0;
            movedElements.forEach((movedElement) => router.moveElement(movedElement));
            movedElements.clear();
            route();
        });
    });

    applyOptions();
});
