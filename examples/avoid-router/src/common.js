import { dia, linkTools, highlighters } from '@joint/core';

// Avoid Docs
// https://www.adaptagrams.org/documentation/annotated.html

// There is a bug in JointJS, that does not allow you to use port
// ids that are numbers.

export function createPaper(canvasEl, cellNamespace, paperOptions = {}) {
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
        interactive: { labelMove: false },
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
        ...paperOptions,
    });

    canvasEl.appendChild(paper.el);

    return { graph, paper };
}

export function addLinkInteractionHandlers(paper) {
    // Add a class to the links when they are being interacted with.
    // See `styles.css` for the styles.

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

    paper.on('link:pointerdown', (linkView) => {
        highlighters.addClass.add(linkView, 'line', 'active-link', {
            className: 'active-link'
        });
    });

    paper.on('link:pointerup', (linkView) => {
        highlighters.addClass.remove(linkView);
    });
}

export function addRouterStyling(routerService) {
    // Dim links while the router is (re)computing their route, and restore
    // their normal appearance once a route has been applied.
    routerService.on('pending', (link) => {
        link.attr('line/strokeDasharray', '5,5');
    });

    routerService.on('routed', (link) => {
        link.attr('line/strokeDasharray', null);
    });
}
