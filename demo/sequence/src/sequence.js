(function(dia, sd, linkTools, elementTools, connectionStrategies, highlighters, paperElement) {

    const paperWidth = 800;
    const paperHeight = 600;
    const topY = 20;

    const graph = new dia.Graph();
    const paper = new dia.Paper({
        el: paperElement,
        width: paperWidth,
        height: paperHeight,
        model: graph,
        frozen: true,
        async: true,
        sorting: dia.Paper.sorting.APPROX,
        defaultConnectionPoint: { name: 'rectangle' },
        background: { color:  '#F3F7F6' },
        moveThreshold: 5,
        linkPinning: false,
        markAvailable: true,
        preventDefaultBlankAction: false,
        restrictTranslate: function(elementView) {
            const element = elementView.model;
            const padding = (element.isEmbedded()) ? 20 : 10;
            return {
                x: padding,
                y: element.getBBox().y,
                width: paperWidth - 2 * padding,
                height: 0
            };
        },
        interactive: function(cellView) {
            const cell = cellView.model;
            return (cell.isLink())
                ? { linkMove: false, labelMove: false }
                : true;
        },
        defaultLink: function(sourceView) {
            const type = sourceView.model.get('type');
            switch (type) {
                case 'sd.Message': {
                    return new sd.LifeSpan();
                }
                case 'sd.Lifeline': {
                    return new sd.Message();
                }
            }
            throw new Error('Unknown link type.');
        },
        connectionStrategy: function(end, cellView, magnet, p, link, endType, paper) {
            const type = link.get('type');
            switch (type) {
                case 'sd.LifeSpan': {
                    if (endType === 'source') {
                        end.anchor = { name: 'connectionRatio', args: { ratio: 1 }};
                    } else {
                        end.anchor = { name: 'connectionRatio', args: { ratio: 0 }};
                    }
                    return end;
                }
                case 'sd.Message': {
                    if (endType === 'source') {
                        return connectionStrategies.pinAbsolute.call(paper, end, cellView, magnet, p, link, endType, paper);
                    } else {
                        end.anchor = { name: 'connectionPerpendicular' };
                        return end;
                    }
                }
            }
        },
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            if (cellViewS === cellViewT) return false;
            const type = linkView.model.get('type');
            const targetType = cellViewT.model.get('type');
            switch (type) {
                case 'sd.Message': {
                    return targetType === 'sd.Lifeline';
                }
                case 'sd.LifeSpan': {
                    if (targetType !== 'sd.Message') return false;
                    if (cellViewT.model.source().id !== cellViewS.model.target().id) return false;
                    return true;
                }
            }
        },
        highlighting: {
            connecting: {
                name: 'addClass',
                options: {
                    className: 'highlighted-connecting'
                }
            }
        }
    });

    paper.el.style.border = '1px solid #E5E5E5';

    paper.on('link:pointermove', function(linkView, _evt, _x, y) {
        const type = linkView.model.get('type');
        switch (type) {
            case 'sd.Message': {
                const sView = linkView.sourceView;
                const tView = linkView.targetView;
                if (!sView || !tView) return;
                const padding = 20;
                const minY = Math.max(tView.sourcePoint.y - sView.sourcePoint.y, 0) + padding;
                const maxY = sView.targetPoint.y - sView.sourcePoint.y - padding;
                linkView.model.setStart(Math.min(Math.max(y - sView.sourcePoint.y, minY), maxY));
                break;
            }
            case 'sd.LifeSpan': {
                break;
            }
        }
    });

    paper.on('link:connect', function(linkView) {
        const type = linkView.model.get('type');
        switch (type) {
            case 'sd.Message': {
                editText(linkView, 'labels/0/attrs/labelText/text');
                break;
            }
            case 'sd.LifeSpan': {
                break;
            }
        }
    });

    const toolsScale = 1.2;

    graph.on('add', function(link) {
        if (!link.isLink()) return;
        const type = link.get('type');
        switch (type) {
            case 'sd.Lifeline': {
                const tools = new dia.ToolsView({
                    layer: null,
                    tools: [
                        new linkTools.HoverConnect({
                            scale: toolsScale
                        }),
                    ]
                });
                link.findView(paper).addTools(tools);
                break;
            }
        }
    });

    paper.on('cell:mouseenter', function(cellView) {
        const cell = cellView.model;
        const type = cell.get('type');
        switch (type) {
            case 'sd.Message': {
                const tools = new dia.ToolsView({
                    tools: [
                        new linkTools.Connect({
                            scale: toolsScale,
                            distance: -20
                        }),
                        new linkTools.Remove({
                            scale: toolsScale,
                            distance: 15
                        })
                    ]
                });
                cellView.addTools(tools);
                break;
            }
            case 'sd.LifeSpan': {
                const tools = new dia.ToolsView({
                    tools: [
                        new linkTools.Remove({
                            scale: toolsScale,
                            distance: 15
                        })
                    ]
                });
                cellView.addTools(tools);
                break;
            }
            case 'sd.Role': {
                const tools = new dia.ToolsView({
                    tools: [
                        new elementTools.Remove({
                            scale: toolsScale,
                            distance: '50%'
                        })
                    ]
                });
                cellView.addTools(tools);
                break;
            }
        }
    });

    paper.on('cell:mouseleave', function(cellView) {
        const cell = cellView.model;
        const type = cell.get('type');
        switch (type) {
            case 'sd.Role':
            case 'sd.LifeSpan':
            case 'sd.Message': {
                cellView.removeTools();
                break;
            }
        }
    });

    paper.on('blank:pointerdblclick', function(evt, x, y) {
        const role = new sd.Role({ position: { x: x - 50, y: topY }});
        role.addTo(graph);
        const lifeline = new sd.Lifeline();
        lifeline.attachToRole(role, paperHeight);
        lifeline.addTo(graph);
        editText(role.findView(paper), 'attrs/label/text');
    });

    const role1 = new sd.Role({ position: { x: 100, y: topY }});
    role1.setName('Browser');
    role1.addTo(graph);

    const role2 = new sd.Role({ position: { x: 400, y: topY }});
    role2.setName('Web Server');
    role2.addTo(graph);

    const role3 = new sd.Role({ position: { x: 600, y: topY }});
    role3.setName('Database Server');
    role3.addTo(graph);

    const backend = new sd.RoleGroup();
    backend.embed(role2);
    backend.embed(role3);
    backend.addTo(graph);
    backend.fitRoles();
    backend.listenTo(graph, 'change:position', function(cell) {
        if (cell.isEmbeddedIn(backend)) backend.fitRoles();
    });
    graph.on('remove', function(element) {
        if (!element.isElement()) return;
        const embeds = backend.getEmbeddedCells();
        if (embeds.length < 2) {
            backend.unembed(embeds);
            backend.remove();
        }
    });

    const lifeline1 = new sd.Lifeline();
    lifeline1.attachToRole(role1, paperHeight);
    lifeline1.addTo(graph);

    const lifeline2 = new sd.Lifeline();
    lifeline2.attachToRole(role2, paperHeight);
    lifeline2.addTo(graph);

    const lifeline3 = new sd.Lifeline();
    lifeline3.attachToRole(role3, paperHeight);
    lifeline3.addTo(graph);

    const message1 = new sd.Message();
    message1.setFromTo(lifeline1, lifeline2);
    message1.setStart(50);
    message1.setDescription('HTTP GET Request');
    message1.addTo(graph);

    const message2 = new sd.Message();
    message2.setFromTo(lifeline2, lifeline3);
    message2.setStart(150);
    message2.setDescription('SQL Command');
    message2.addTo(graph);

    const message3 = new sd.Message();
    message3.setFromTo(lifeline3, lifeline2);
    message3.setStart(250);
    message3.setDescription('Result Set');
    message3.addTo(graph);

    const message4 = new sd.Message();
    message4.setFromTo(lifeline2, lifeline1);
    message4.setStart(350);
    message4.setDescription('HTTP Response');
    message4.addTo(graph);

    const lifespan1 = new sd.LifeSpan();
    lifespan1.attachToMessages(message2, message3);
    lifespan1.addTo(graph);

    paper.unfreeze();

    // Text Editing

    function editText(cellView, textPath) {

        const cell = cellView.model;
        const textarea = document.createElement('textarea');
        textarea.style.position = 'absolute';
        textarea.style.width ='200px';
        textarea.style.height = '100px';
        textarea.style.left = '50%';
        textarea.style.top = `${paper.options.height / 2}px`;
        textarea.style.transform = 'translate(-50%, -50%)';
        textarea.style.padding = '5px';
        textarea.style.resize = 'none';
        textarea.style.boxShadow = '10px 10px 5px rgba(0, 0, 0, 0.5)';
        textarea.placeholder = cell.placeholder || 'Enter text here...';
        textarea.value = cell.prop(textPath) || '';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.setSelectionRange(0, textarea.value.length);

        cellView.paper.el.style.filter = 'blur(0.5px) grayscale(1)';
        cellView.paper.el.style.pointerEvents = 'none';

        const highlighter = highlighters.mask.add(cellView, 'root', 'selection', {
            layer: dia.Paper.Layers.FRONT,
            deep: true
        });

        function close() {
            textarea.remove();
            cellView.paper.el.style.filter = '';
            cellView.paper.el.style.pointerEvents = '';
            highlighter.remove();
        }

        function saveText() {
            cell.prop(textPath, textarea.value);
            close();
        }

        textarea.addEventListener('blur', saveText);

        textarea.addEventListener('keydown', function(evt) {
            if (evt.key === 'Enter' && !evt.shiftKey) {
                textarea.blur();
            }
            if (evt.key === 'Escape') {
                textarea.removeEventListener('blur', saveText);
                close();
            }
        });
    }

    paper.on('link:pointerdblclick', function(linkView, evt) {
        const labelIndex = linkView.findAttribute('label-idx', evt.target);
        if (!labelIndex) return;
        editText(linkView, `labels/${labelIndex}/attrs/labelText/text`);
    });

    paper.on('element:pointerdblclick', function(elementView, evt) {
        switch (elementView.model.get('type')) {
            case 'sd.Role': {
                editText(elementView, 'attrs/label/text');
                break;
            }
            case 'sd.RoleGroup': {
                editText(elementView, 'attrs/label/text');
                break;
            }
        }
    });

})(
    joint.dia,
    joint.shapes.sd,
    joint.linkTools,
    joint.elementTools,
    joint.connectionStrategies,
    joint.highlighters,
    document.getElementById('paper')
);
