(function(joint) {

    const HEADER_HEIGHT = 30;

    const cellNamespace = {
        // includes additional defined shapes from `./joint.shapes.container.js`
        ...joint.shapes
    };

    const graph = new joint.dia.Graph({}, { cellNamespace });
    const paper = new joint.dia.Paper({
        width: 800,
        height: 600,
        model: graph,
        cellViewNamespace: cellNamespace,
        async: true,
        background: {
            color: '#F3F7F6'
        },
        interactive: { linkMove: false },
        viewport: function(view) {
            const cell = view.model;
            // Hide any element or link which is embedded inside a collapsed parent (or parent of the parent).
            const hidden = cell.getAncestors().some(function(ancestor) {
                if (ancestor.isCollapsed()) return true;
                if (cell.isElement()) {
                    return ancestor.isChildFiltered(cell);
                } else {
                    return (
                    ancestor.isChildFiltered(cell.getSourceCell()) ||
                    ancestor.isChildFiltered(cell.getTargetCell())
                    );
                }
            });
            return !hidden;
        }
    });

    document.getElementById('paper').appendChild(paper.el);

    // Custom highlighter to render the expand/collapse button.
    const ExpandButtonHighlighter = joint.dia.HighlighterView.extend({
        tagName: 'g',

        UPDATE_ATTRIBUTES: ['collapsed'],

        children: function() {
            return [
                {
                    tagName: 'rect',
                    selector: 'button',
                    attributes: {
                    fill: '#000000',
                    fillOpacity: 0.2,
                    stroke: '#FFFFFF',
                    strokeWidth: 0.5,
                    x: -7,
                    y: -7,
                    width: 14,
                    height: 14,
                    cursor: 'pointer'
                    }
                },
                {
                    tagName: 'path',
                    selector: 'icon',
                    attributes: {
                    fill: 'none',
                    stroke: '#FFFFFF',
                    strokeWidth: 1,
                    pointerEvents: 'none'
                    }
                }
            ];
        },

        events: {
            click: 'onClick'
        },

        onClick() {
            this.cellView.model.toggle();
        },

        // Method called to highlight a CellView
        highlight(cellView, _node) {
            if (this.el.childNodes.length === 0) {
                this.renderChildren();
            }

            const size = cellView.model.size();
            this.el.setAttribute(
                'transform',
                `translate(${size.width - HEADER_HEIGHT / 2}, ${HEADER_HEIGHT / 2})`
            );

            let d;
            if (cellView.model.get('collapsed')) {
                d = 'M -4 0 4 0 M 0 -4 0 4';
            } else {
                d = 'M -4 0 4 0';
            }
            this.childNodes.icon.setAttribute('d', d);
        }
    });

    graph.on({
        'add': function(cell) {
            if (joint.shapes.container.Parent.isContainer(cell)) {
                // Add the expand button highlighter.
                ExpandButtonHighlighter.add(cell.findView(paper), 'root', 'expand-button');
            }
        },

        'remove': function(cell) {
            if (cell.isLink()) return;
            updateContainerSize(cell.getParentCell());
        },

        'change:position': function(cell) {
            if (cell.isLink()) return;
            updateContainerSize(cell.getParentCell());
        },

        'change:size': function(cell) {
            if (cell.isLink()) return;
            updateContainerSize(cell.getParentCell());
        },

        'change:embeds': function(cell) {
            if (cell.isLink()) return;
            updateContainerSize(cell);
        },

        'change:collapsed': function(cell) {
            updateContainerSize(cell);
        }
    });

    function updateContainerSize(container) {
        if (!joint.shapes.container.Parent.isContainer(container)) return;
            const flags = { ignoreCommandManager: true };
        if (container.isCollapsed()) {
            container.resize(140, 30, flags);
        } else {
            container.fitToChildElements(flags);
        }
    }

    // Show element tools on hover
    paper.on({
        'element:mouseenter': function(elementView) {
            elementView.removeTools();
            if (joint.shapes.container.Parent.isContainer(elementView.model)) {
                // Silently remove the children elements, then remove the container
                elementView.addTools(
                    new joint.dia.ToolsView({
                        tools: [
                            new joint.elementTools.Remove({
                                useModelGeometry: true,
                                y: 0,
                                x: 0,
                                action: function(evt, view) {
                                    // The children elements removal should not be added to the command manager.
                                    graph.removeCells(view.model.getEmbeddedCells(), { ignoreCommandManager: true });
                                    view.model.remove();
                                }
                            })
                        ]
                    })
                );
            } else if (joint.shapes.container.Child.isChild(elementView.model)) {
                // Remove the element from the graph
                elementView.addTools(
                    new joint.dia.ToolsView({
                        tools: [
                            new joint.elementTools.Remove({
                            useModelGeometry: true,
                            y: 0,
                            x: 0
                            })
                        ]
                    })
                );
            }
        },

        'element:mouseleave': function(elementView) {
            elementView.removeTools();
        }
    });

    // Example diagram
    const container_a = new joint.shapes.container.Parent({
        z: 1,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
        attrs: { headerText: { text: 'Container A' }}
    });

    const container_b = new joint.shapes.container.Parent({
        z: 3,
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
        attrs: { headerText: { text: 'Container B' }}
    });

    const child_1 = new joint.shapes.container.Child({
        z: 2,
        position: { x: 150, y: 50 },
        attrs: { label: { text: 1 }}
    });

    const child_2 = new joint.shapes.container.Child({
        z: 2,
        position: { x: 100, y: 150 },
        attrs: { label: { text: 2 }}
    });

    const child_3 = new joint.shapes.container.Child({
        z: 2,
        position: { x: 200, y: 150 },
        attrs: { label: { text: 3 }}
    });

    const child_4 = new joint.shapes.container.Child({
        z: 4,
        position: { x: 300, y: 190 },
        attrs: { label: { text: '4' }}
    });

    const child_5 = new joint.shapes.container.Child({
        z: 4,
        position: { x: 400, y: 260 },
        attrs: { label: { text: '5' }}
    });

    const link_1_2 = new joint.shapes.container.Link({
        z: 2,
        source: { id: child_1.id },
        target: { id: child_2.id }
    });

    const link_1_3 = new joint.shapes.container.Link({
        z: 2,
        source: { id: child_1.id },
        target: { id: child_3.id }
    });

    const link_4_5 = new joint.shapes.container.Link({
        z: 4,
        source: { id: child_4.id },
        target: { id: child_5.id }
    });

    const link_1_b = new joint.shapes.container.Link({
        z: 4,
        source: { id: child_1.id },
        target: { id: container_b.id }
    });

    graph.addCells([
        container_a, container_b,
        child_1, child_2, child_3, child_4, child_5,
        link_1_2, link_1_3, link_4_5, link_1_b
    ]);

    container_a.embed([child_1, child_2, child_3, container_b]);
    container_b.embed([child_4, child_5]);

    link_1_2.reparent();
    link_1_3.reparent();
    link_4_5.reparent();
    link_1_b.reparent();

})(joint);
