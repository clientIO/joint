import { dia } from '@joint/core';
import { useEffect } from 'react';
import { useCellId, useGraph } from 'src/hooks';

export type Ports = {
  groups?: Record<string, dia.Element.PortGroup>;
  items?: dia.Element.Port[];
};

export interface PortProps {}

export function Port(props: PortProps) {
  const id = useCellId();
  const graph = useGraph();
  //   useEffect(() => {
  //     const cell = graph.getCell(id);
  //     if (!cell) {
  //       throw new Error(`Cell with id ${id} not found`);
  //     }
  //     // cell.set({
  //     //     attrs:{}
  //     // })
  //     const startY = 0;
  //     const ports: Ports = {
  //       groups: {
  //         out: {
  //           position: {
  //             name: 'line',
  //             args: {
  //               start: { x: 'calc(w)', y: startY },
  //               end: { x: 'calc(w)' },
  //             },
  //           },
  //           attrs: {
  //             circle: {
  //               r: 6,
  //               magnet: 'active',
  //               cursor: 'pointer',
  //               fill: '#000000',
  //               stroke: '#FFFFFF',
  //               strokeWidth: 1.5,
  //             },
  //           },
  //         },
  //         in: {
  //           position: {
  //             name: 'line',
  //             args: {
  //               start: { x: 0, y: startY },
  //               end: { x: 0 },
  //             },
  //           },
  //           attrs: {
  //             circle: {
  //               r: 6,
  //               magnet: 'passive', // Allows connections but doesn't initiate them
  //               fill: '#FFFFFF',
  //               stroke: '#000000',
  //               strokeWidth: 1.5,
  //             },
  //           },
  //         },
  //       },
  //       items: [
  //         { id: 'port1', group: 'in' },
  //         { id: 'port2', group: 'out' },
  //       ],
  //     };
  //     cell.set('ports', ports);
  //   }, [graph, id]);
  return (
    <div joint-marget="active">
      <p>Port</p>
    </div>
  );
}
