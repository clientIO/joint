import { dia, shapes } from '@joint/core';

// Three small circuits in which several links attach to the same port: that
// is where the nudging options make a difference.

type PortSide = 'left' | 'right' | 'top' | 'bottom';
type PortDefinition = [id: string, side: PortSide, label: string];

const WIRE_COLORS = {
    power: '#E5484D',
    ground: '#6B7280',
    data: '#12A150',
    clock: '#2F80ED',
};

const portGroups: Record<PortSide, dia.Element.PortGroup> = {
    left: portGroup('left'),
    right: portGroup('right'),
    top: portGroup('top'),
    bottom: portGroup('bottom'),
};

function portGroup(side: PortSide): dia.Element.PortGroup {
    return {
        position: { name: side },
        label: { position: { name: 'inside', args: { offset: 10 }}},
        markup: [{ tagName: 'circle', selector: 'pin' }],
        attrs: {
            pin: { r: 4, fill: '#131E29' },
            text: { fill: '#5A6B7B', fontSize: 10, fontFamily: 'monospace' },
        },
    };
}

function part(id: string, label: string, x: number, y: number, width: number, height: number, ports: PortDefinition[]): dia.Element {
    return new shapes.standard.Rectangle({
        id,
        position: { x, y },
        size: { width, height },
        attrs: {
            body: { fill: '#FFFFFF', stroke: '#131E29', strokeWidth: 1.5, rx: 4, ry: 4 },
            label: { text: label, fill: '#131E29', fontSize: 12, fontWeight: 'bold', fontFamily: 'sans-serif' },
        },
        ports: {
            groups: portGroups,
            items: ports.map(([portId, side, text]) => ({ id: portId, group: side, attrs: { text: { text }}})),
        },
    });
}

function wire(source: [string, string], target: [string, string], color: string): dia.Link {
    return new shapes.standard.Link({
        source: { id: source[0], port: source[1] },
        target: { id: target[0], port: target[1] },
        attrs: { line: { stroke: color, strokeWidth: 2, targetMarker: null }},
        z: -1,
    });
}

function caption(text: string, x: number, y: number): dia.Element {
    return new shapes.standard.TextBlock({
        position: { x, y },
        size: { width: 360, height: 20 },
        attrs: {
            body: { fill: 'none', stroke: 'none' },
            label: {
                text,
                style: { color: '#5A6B7B', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' },
            },
        },
    });
}

/** The cells of the three circuits. */
export function createCells(): dia.Cell[] {
    const cells: dia.Cell[] = [];
    const loads = ['U1', 'U2', 'U3', 'U4'];
    const grounded = ['C1', 'C2', 'C3', 'C4'];

    // Power fan-out: one output pin feeds four loads.
    cells.push(caption('Power fan-out: 1 pin to 4 loads', 20, 10));
    cells.push(part('ldo', 'LDO 3.3 V', 30, 150, 170, 80, [['vin', 'left', 'VIN'], ['vout', 'right', 'VOUT']]));
    loads.forEach((name, index) => {
        cells.push(part(name, name, 330, 50 + index * 85, 100, 55, [['vin', 'left', 'VIN']]));
        cells.push(wire(['ldo', 'vout'], [name, 'vin'], WIRE_COLORS.power));
    });

    // Ground bus: four pins into one.
    cells.push(caption('Ground bus: 4 pins into 1 pin', 20, 420));
    grounded.forEach((name, index) => {
        cells.push(part(name, name, 30 + index * 115, 460, 85, 60, [['gnd', 'bottom', 'GND']]));
    });
    cells.push(part('J1', 'J1', 190, 640, 120, 55, [['gnd', 'top', 'GND']]));
    grounded.forEach((name) => cells.push(wire([name, 'gnd'], ['J1', 'gnd'], WIRE_COLORS.ground)));

    // I2C header: SDA and SCL each have two links (controller and pull-up)
    // on neighboring pins, next to the supply rail.
    cells.push(caption('I2C header: 2 links on neighboring pins', 620, 10));
    cells.push(part('mcu', 'MCU', 640, 120, 130, 190, [['sda', 'right', 'SDA'], ['scl', 'right', 'SCL'], ['vdd', 'top', 'VDD']]));
    cells.push(part('R1', 'R1', 860, 70, 50, 40, [['a', 'top', ''], ['b', 'bottom', '']]));
    cells.push(part('R2', 'R2', 930, 70, 50, 40, [['a', 'top', ''], ['b', 'bottom', '']]));
    cells.push(part('J3', 'J3', 1050, 140, 80, 170, [['vs', 'left', 'VS'], ['sda', 'left', 'SDA'], ['scl', 'left', 'SCL'], ['gnd', 'left', 'GND']]));
    cells.push(part('reg', '3V3', 640, 420, 110, 60, [['vout', 'right', 'VOUT']]));
    cells.push(part('gnd', 'GND', 900, 560, 70, 40, [['in', 'top', '']]));
    cells.push(wire(['mcu', 'sda'], ['J3', 'sda'], WIRE_COLORS.data));
    cells.push(wire(['mcu', 'scl'], ['J3', 'scl'], WIRE_COLORS.clock));
    cells.push(wire(['R1', 'b'], ['J3', 'sda'], WIRE_COLORS.data));
    cells.push(wire(['R2', 'b'], ['J3', 'scl'], WIRE_COLORS.clock));
    cells.push(wire(['reg', 'vout'], ['J3', 'vs'], WIRE_COLORS.power));
    cells.push(wire(['reg', 'vout'], ['R1', 'a'], WIRE_COLORS.power));
    cells.push(wire(['reg', 'vout'], ['R2', 'a'], WIRE_COLORS.power));
    cells.push(wire(['reg', 'vout'], ['mcu', 'vdd'], WIRE_COLORS.power));
    cells.push(wire(['J3', 'gnd'], ['gnd', 'in'], WIRE_COLORS.ground));

    return cells;
}
