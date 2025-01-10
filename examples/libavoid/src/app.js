import { linkTools, elementTools, dia, shapes, highlighters } from '@joint/core';
import { Node, Edge } from './shapes';
import ResizeTool from './resize-tool';
import { AvoidRouter } from './avoid-router';

// Avoid Docs
// https://www.adaptagrams.org/documentation/annotated.html

// There is a bug in JointJS, that does not allow you to use port
// ids that are numbers.

export const init = async () => {
    await AvoidRouter.load();

    const canvasEl = document.getElementById('canvas');

    const cellNamespace = {
        ...shapes,
        Node,
        Edge,
    };

    const graph = new dia.Graph({}, { cellNamespace });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 1000,
        height: 600,
        gridSize: 10,
        interactive: { linkMove: false },
        linkPinning: false,
        async: true,
        frozen: true,
        background: { color: '#F3F7F6' },
        snapLinks: { radius: 30 },
        overflow: true,
        defaultConnector: {
            name: 'straight',
            args: {
                cornerType: 'cubic',
                cornerRadius: 4,
            },
        },
        highlighting: {
            default: {
                name: 'mask',
                options: {
                    padding: 2,
                    attrs: {
                        stroke: '#EA3C24',
                        strokeWidth: 2,
                    },
                },
            },
        },
        defaultLink: () => new Edge(),
        validateConnection: (
            sourceView,
            sourceMagnet,
            targetView,
            targetMagnet,
            end
        ) => {
            const source = sourceView.model;
            const target = targetView.model;
            if (source.isLink() || target.isLink()) return false;
            if (targetMagnet === sourceMagnet) return false;
            if (end === 'target' ? targetMagnet : sourceMagnet) {
                return true;
            }
            if (source === target) return false;
            return end === 'target' ? !target.hasPorts() : !source.hasPorts();
        },
    });

    // create n nodes with links between each other in a chain
    const n = 200;
    const nodes = Array.from({ length: n }, (_, i) => {
        return new Node({
            position: { x: 100, y: i * 200},
            size: { width: 100, height: 100 },
            ports: {
                items: [
                    {
                        group: 'top',
                        id: `port${i + 1}`,
                    },
                    {
                        group: 'right',
                        id: `port${i + 2}`,
                    },
                    {
                        group: 'left',
                        id: `port${i + 3}`,
                    },
                ],
            },
        });
    });

    const links = nodes.slice(0, -1).map((node, i) => {
        return new Edge({
            source: { id: node.id, port: `port${i + 1}` },
            target: { id: nodes[i + 1].id, port: `port${i + 2}` },
            router: { name: 'rightAngle'}
        });
    });

    graph.addCells([...nodes, ...links]);

    links.forEach((link) => {
        highlighters.addClass.add(link.findView(paper), 'line', 'awaiting-update', {
            className: 'awaiting-update'
        });
    });


    canvasEl.appendChild(paper.el);

    paper.unfreeze();
    paper.fitToContent({
        useModelGeometry: true,
        padding: 100,
        allowNewOrigin: 'any',
    });

    // Add tools to the elements.
    graph.getElements().forEach((el) => addElementTools(el, paper));
    graph.on('add', (cell) => {
        if (cell.isLink()) return;
        addElementTools(cell, paper);
    });

    function addElementTools(el, paper) {
        const tools = [
            new ResizeTool({
                selector: 'body',
            }),
            new elementTools.Remove({
                useModelGeometry: true,
                x: -10,
                y: -10,
            }),
        ];
        if (!el.hasPorts()) {
            tools.push(
                new elementTools.Connect({
                    useModelGeometry: true,
                    x: 'calc(w + 10)',
                    y: 'calc(h - 20)',
                })
            );
        }

        el.findView(paper).addTools(new dia.ToolsView({ tools }));
    }

    // Add tools to the links.
    paper.on('link:mouseenter', (linkView) => {
        linkView.addTools(
            new dia.ToolsView({
                tools: [
                    new linkTools.Remove(),
                    new linkTools.TargetArrowhead(),
                ],
            })
        );
    });

    paper.on('link:mouseleave', (linkView) => {
        linkView.removeTools();
    });

    paper.on('blank:pointerdblclick', (evt, x, y) => {
        const node = new Node({
            position: { x: x - 50, y: y - 50 },
            size: { width: 100, height: 100 },
        });
        graph.addCell(node);
    });

    // Add a class to the links when they are being interacted with.
    // See `styles.css` for the styles.

    paper.on('link:pointerdown', (linkView) => {
        highlighters.addClass.add(linkView, 'line', 'active-link', {
            className: 'active-link'
        });
    });

    paper.on('link:pointerup', (linkView) => {
        highlighters.addClass.remove(linkView);
    });

    // Start the Avoid Router.

    // const router = new AvoidRouter(graph, {
    //     shapeBufferDistance: 20,
    //     idealNudgingDistance: 10,
    //     portOverflow: Node.PORT_RADIUS,
    // });

    // router.addGraphListeners();
    // router.routeAll();

    const routerWorker = new Worker(new URL("./worker.js", import.meta.url));

    routerWorker.onmessage = (e) => {
        const { command, ...data } = e.data;
        switch (command) {
            case 'routed': {
                const { cells } = data;
                cells.forEach((cell) => {
                    const model = graph.getCell(cell.id);
                    if (model.isElement()) return;
                    model.set({
                        vertices: cell.vertices,
                        source: cell.source,
                        target: cell.target,
                        router: null
                    }, {
                        fromWorker: true
                    });
                });
                highlighters.addClass.removeAll(paper, 'awaiting-update');
                break;
            }
            default:
                console.log('Unknown command', command);
                break;
        }
    }

    routerWorker.postMessage([{
        command: 'reset',
        cells: graph.toJSON().cells
    }]);

    graph.on('change', (cell, opt) => {

        if (opt.fromWorker) {
            return;
        }

        routerWorker.postMessage([{
            command: 'change',
            cell: cell.toJSON()
        }]);

        if (cell.isElement() && (cell.hasChanged('position') || cell.hasChanged('size'))) {
            const links = graph.getConnectedLinks(cell);
            links.forEach((link) => {
                link.router() || link.router('rightAngle');
                highlighters.addClass.add(link.findView(paper), 'line', 'awaiting-update', {
                    className: 'awaiting-update'
                });
            });
        }

    });

    graph.on('remove', (cell) => {
        routerWorker.postMessage([{
            command: 'remove',
            id: cell.id
        }]);
    });

    graph.on('add', (cell) => {
        routerWorker.postMessage([{
            command: 'add',
            cell: cell.toJSON()
        }]);
    });

    paper.on('link:snap:connect', (linkView) => {
        linkView.model.router('rightAngle');
    });

    paper.on('link:snap:disconnect', (linkView) => {
        linkView.model.set({
            vertices: [],
            router: null
        });
    });

};
