    // Credit: https://www.soundonsound.com/sound-advice/q-aux-and-bus-explained

    import { dia, shapes } from '@joint/core';
    import { Bus, Connector, Component, Fader, Aux } from './shapes';
    import './styles.css';

    const namespace = {
        ...shapes,
        mix: {
            Bus,
            Connector,
            Component,
            Fader,
            Aux
        }
    }

    const graph = new dia.Graph({}, { cellNamespace: namespace });

    const paper = new dia.Paper({
        el: document.getElementById('paper-container'),
        width: 1000,
        height: 725,
        model: graph,
        cellViewNamespace: namespace,
        async: true,
        frozen: true,
        restrictTranslate: true,
        defaultConnectionPoint: {
            name: 'boundary',
            args: { selector: 'body' }
        },
        defaultAnchor: {
            name: 'perpendicular'
        },
        defaultLinkAnchor: {
            name: 'connectionPerpendicular'
        },
        interactive: {
            linkMove: false,
            labelMove: false
        },
        highlighting: {
            default: {
                name: 'addClass',
                options: {
                    className: 'active'
                }
            }
        }
    });

    paper.on('cell:mouseenter', function(cellView) {
        getCellOutbounds(this.model, cellView.model).forEach(function(cell) {
            cell.findView(this).highlight();
        }, this);
    });

    paper.on('cell:mouseleave cell:pointerdown', function(cellView) {
        getCellOutbounds(this.model, cellView.model).forEach(function(cell) {
            cell.findView(this).unhighlight();
        }, this);
    });

    function getCellOutbounds(graph, cell) {
        return [cell].concat(
            graph.getNeighbors(cell, { outbound: true, indirect: true }),
            graph.getConnectedLinks(cell, { outbound: true, indirect: true })
        );
    }

    // Create shapes
    const mix = namespace.mix;
    const bus1 = mix.Bus.create(600, 'Sub-group 1', '#333333');
    const bus2 = mix.Bus.create(625, 'Sub-group 2', '#333333');
    const bus3 = mix.Bus.create(650, 'Sub-group 3', '#333333');
    const bus4 = mix.Bus.create(675, 'Sub-group 4', '#333333');
    const bus5 = mix.Bus.create(700, 'Mix Left', '#ff5964');
    const bus6 = mix.Bus.create(725, 'Mix Right', '#b5d99c');
    const bus7 = mix.Bus.create(750, 'Post-fade Aux', '#35a7ff');
    const bus8 = mix.Bus.create(775, 'Pre-fade Aux', '#6b2d5c');
    const component1 = mix.Component.create(850, 80, 80, 80, 'Stereo Mix').addPort({ group: 'out' });
    const component2 = mix.Component.create(840, 230, 100, 30, 'Pre Aux').addPort({ group: 'out' });
    const component3 = mix.Component.create(840, 180, 100, 30, 'Post Aux').addPort({ group: 'out' });
    const component4 = mix.Component.create(450, 100, 90, 100, 'Output Routing');
    const component5 = mix.Component.create(450, 350, 90, 100, 'Output Routing');
    const component6 = mix.Component.create(100, 130, 150, 40, 'Input Channel').addPort({ group: 'in' });
    const component7 = mix.Component.create(100, 380, 150, 40, 'Sub-group 1');
    const fader1 = mix.Fader.create(350, 110, 80, 100, 'Output Routing');
    const fader2 = mix.Fader.create(350, 360, 80, 100, 'Output Routing');
    const aux1 = mix.Aux.create(420, 220, 'Post-fade Aux');
    const aux2 = mix.Aux.create(350, 260, 'Pre-fade Aux');
    const aux3 = mix.Aux.create(420, 470, 'Post-fade Aux');
    const aux4 = mix.Aux.create(350, 510, 'Pre-fade Aux');
    const connector1 = mix.Connector.create(bus1, component7);
    const connector2 = mix.Connector.create(fader2, component5);
    const connector3 = mix.Connector.create(connector2, aux3);
    const connector4 = mix.Connector.create(fader1, component4);
    const connector5 = mix.Connector.create(connector4, aux1);
    const connector6 = mix.Connector.create(component7, fader2);
    const connector7 = mix.Connector.create(connector6, aux4);
    const connector8 = mix.Connector.create(component6, fader1);
    const connector9 = mix.Connector.create(connector8, aux2);
    const connector10 = mix.Connector.create(bus5, [component1, -10]);
    const connector11 = mix.Connector.create(bus6, [component1, 10]);
    const connector12 = mix.Connector.create(bus7, component3);
    const connector13 = mix.Connector.create(bus8, component2);
    const connector14 = mix.Connector.create([component4, -40], bus1);
    const connector15 = mix.Connector.create([component4, -24], bus2);
    const connector16 = mix.Connector.create([component4, -8], bus3);
    const connector17 = mix.Connector.create([component4, 8], bus4);
    const connector18 = mix.Connector.create([component4, 24], bus5);
    const connector19 = mix.Connector.create([component4, 40], bus6);
    const connector20 = mix.Connector.create([component5, -20], bus5);
    const connector21 = mix.Connector.create([component5, 20], bus6);
    const connector22 = mix.Connector.create(aux1, bus7);
    const connector23 = mix.Connector.create(aux2, bus8);
    const connector24 = mix.Connector.create(aux3, bus7);
    const connector25 = mix.Connector.create(aux4, bus8);

    // Special Marker
    connector1.attr('line', {
        sourceMarker: {
            'type': 'path',
            'd': 'M -2 -8 15 0 -2 8 z'
        }
    });

    // Vertices
    connector1.vertices([{ x: 175, y: 320 }]);
    connector3.vertices([{ x: 400, y: 485 }]);
    connector5.vertices([{ x: 400, y: 235 }]);
    connector7.vertices([{ x: 310, y: 525 }]);
    connector9.vertices([{ x: 310, y: 275 }]);

    // Embed vertices
    component7.embed(connector1);
    aux3.embed(connector3);
    aux1.embed(connector5);
    aux4.embed(connector7);
    aux2.embed(connector9);

    graph.resetCells([
        bus1,
        bus2,
        bus3,
        bus4,
        bus5,
        bus6,
        bus7,
        bus8,
        component1,
        component2,
        component3,
        component4,
        component5,
        component6,
        component7,
        fader1,
        fader2,
        aux1,
        aux2,
        aux3,
        aux4,
        connector1,
        connector2,
        connector3,
        connector4,
        connector5,
        connector6,
        connector7,
        connector8,
        connector9,
        connector10,
        connector11,
        connector12,
        connector13,
        connector14,
        connector15,
        connector16,
        connector17,
        connector18,
        connector19,
        connector20,
        connector21,
        connector22,
        connector23,
        connector24,
        connector25
    ]);

    paper.unfreeze();
