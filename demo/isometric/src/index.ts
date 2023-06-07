import { g, dia } from 'jointjs';
import Obstacles from './obstacles';
import IsometricShape, { View } from './shapes/isometric-shape';
import { Computer, Database, ActiveDirectory, User, Firewall, Switch, Router, Link, cellNamespace } from './shapes';
import { sortElements, drawGrid, switchView } from './utils';
import { GRID_SIZE, GRID_COUNT, HIGHLIGHT_COLOR, SCALE, ISOMETRIC_SCALE } from './theme';

import '../style.css';
import 'jointjs/dist/joint.css';

const canvasEl = document.getElementById('canvas') as HTMLDivElement;
const buttonEl = document.getElementById('toggle') as HTMLButtonElement;

let currentView = View.Isometric;
let currentCell: IsometricShape | Link = null;

const graph = new dia.Graph({}, { cellNamespace });

// Obstacles listen to changes in the graph and update their internal state
const obstacles = new Obstacles(graph);
graph.set('obstacles', obstacles);

const paper = new dia.Paper({
    el: canvasEl,
    model: graph,
    // Prevent the elements from being dragged outside of the paper
    // and from being dropped on top of other elements
    restrictTranslate: (elementView) => {
        const element = elementView.model as IsometricShape;
        const { width, height } = element.size();
        // a little memory allocation optimization
        // we don't need to create a new rect on every call, we can reuse the same one
        const newBBox = new g.Rect();
        return function(x, y) {
            newBBox.update(x , y, width, height);
            return obstacles.isFree(newBBox, element.cid)
                ? { x, y }
                : element.position();
        }
    },
    gridSize: GRID_SIZE,
    async: true,
    autoFreeze: true,
    sorting: dia.Paper.sorting.APPROX,
    defaultConnectionPoint: {
        name: 'boundary',
        args: {
            offset: GRID_SIZE / 2,
            // It's important to set selector to false, and determine the magnet
            // with `magnet-selector` attribute on the element.
            // Otherwise, the element bounding box would contain the isometric part of the element
            // and the connection would be created to the wrong point.
            selector: false
        }
    },
    defaultRouter: {
        name: 'manhattan',
        args: {
            step: GRID_SIZE / 2,
            startDirections: ['top'],
            endDirections: ['bottom'],
            // Use the existing obstacle detection to determine if the point is an obstacle
            // By default, the router would need to build its own obstacles map
            isPointObstacle: (point: g.Point) => {
                const x = Math.floor(point.x / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
                const y = Math.floor(point.y / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
                const rect = new g.Rect(x, y, GRID_SIZE * 3, GRID_SIZE * 2);
                return !obstacles.isFree(rect);
            }
        }
    },
    defaultLink: () => new Link(),
    linkPinning: false,
    overflow: true,
    snapLinks: { radius: GRID_SIZE / 2 },
    cellViewNamespace: cellNamespace,
    defaultAnchor: { name: 'modelCenter' },
    highlighting: {
        default: {
            name: 'mask',
            options: {
                layer: dia.Paper.Layers.BACK,
                attrs: {
                    'stroke': HIGHLIGHT_COLOR,
                    'stroke-width': 3
                }
            }
        }
    }
});

drawGrid(paper, GRID_COUNT, GRID_SIZE);

// Set the paper size to fit the transformed isometric grid
paper.setDimensions(
    2 * GRID_SIZE * GRID_COUNT * SCALE * ISOMETRIC_SCALE + (2 * GRID_SIZE),
    GRID_SIZE * GRID_COUNT * SCALE + (2 * GRID_SIZE)
);

// Generate example graph

const c1 = new Computer().position(40, 140).attr('label/text', 'Computer 1');
const c2 = new Computer().position(180, 140).attr('label/text', 'Computer 2');
const db1 = new Database().position(100, 20);
const ad1 = new ActiveDirectory().position(100, 260);
const admin = new User().position(100, 460).attr('label/text', 'Admin');
const user = new User().position(280, 460);
const firewall = new Firewall().position(260, 380);
const switchEl = new Switch().position(400, 160);
const router = new Router().position(400, 100);

const l1 = new Link().source(ad1).target(c1);
const l2 = l1.clone().target(c2);
const l3 = new Link().source(c1).target(db1);
const l4 = l3.clone().source(c2);
const l5 = new Link().source(user).target(firewall);
const l6 = new Link().source(firewall).target(ad1);
const l7 = new Link().source(admin).target(ad1);

graph.resetCells([c1, c2, db1, ad1, l1, l2, l3, l4, admin, l5, firewall, l6, user, l7, switchEl, router]);

// Sort cells on position and size change

graph.on('change:position change:size', () => {
    if (currentView !== View.Isometric) return;
    sortElements(graph);
});

// Switch between isometric and 2D view

buttonEl.addEventListener('click', () => {
    currentView = (currentView === View.Isometric) ? View.TwoDimensional : View.Isometric;
    switchView(paper, currentView, currentCell);
});

switchView(paper, currentView, currentCell);

// Show/Hide tools on cell pointer events

paper.on('link:pointerup', (linkView: dia.LinkView) => {
    const link = linkView.model as Link;
    paper.removeTools();
    link.addTools(paper);
    currentCell = link;
});

paper.on('element:pointerup', (elementView: dia.ElementView) => {
    const shape = elementView.model as IsometricShape;
    paper.removeTools();
    shape.addTools(paper, currentView);
    currentCell = shape;
});

paper.on('blank:pointerdown', () => {
    paper.removeTools();
    currentCell = null;
});

// Setup scrolling

paper.el.style.cursor = 'grab';

paper.on('blank:pointerdown', (evt) => {
    evt.data = {
        scrollX: window.scrollX, clientX: evt.clientX,
        scrollY: window.scrollY, clientY: evt.clientY
    };
    paper.el.style.cursor = 'grabbing';
});

paper.on('blank:pointermove', (evt) => {
    window.scroll(evt.data.scrollX + (evt.data.clientX - evt.clientX), evt.data.scrollY + (evt.data.clientY - evt.clientY));
});

paper.on('blank:pointerup', () => {
    paper.el.style.cursor = 'grab';
});

