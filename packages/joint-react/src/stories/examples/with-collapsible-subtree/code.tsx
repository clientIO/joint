/* eslint-disable react-perf/jsx-no-new-array-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { ElementToGraphOptions } from '@joint/react';
import { type GraphElement, GraphProvider, Paper, TextNode, useCellActions, usePaper } from '@joint/react';
import { BG, LIGHT, PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
import { useCallback, useMemo } from 'react';
import type { dia } from '@joint/core';

import '../index.css';

// Base properties shared by all events
interface BaseEvent extends GraphElement {
  readonly label: string;
  readonly hidden?: boolean;
}

const GATE_TYPES = ['OR', 'XOR', 'AND', 'PRIORITY_AND', 'INHIBIT', 'TRANSFER'] as const;

interface IntermediateEvent extends BaseEvent {
  readonly type: 'IntermediateEvent';
  readonly gate: (typeof GATE_TYPES)[number];
  readonly width: number;
  readonly height: number;
}

interface UndevelopedEvent extends BaseEvent {
  readonly type: 'UndevelopedEvent';
}

interface BasicEvent extends BaseEvent {
  readonly type: 'BasicEvent';
}

interface ExternalEvent extends BaseEvent {
  readonly type: 'ExternalEvent';
}

interface ConditioningEvent extends BaseEvent {
  readonly type: 'ConditioningEvent';
}

type FTAElement =
  | IntermediateEvent
  | UndevelopedEvent
  | BasicEvent
  | ExternalEvent
  | ConditioningEvent;

const initialElements: FTAElement[] = [
  {
    id: 'ot8h17',
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Fall from Scaffolding',
    gate: 'INHIBIT',
  },
  {
    id: 'd8jpey',
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Fall from the Scaffolding',
    gate: 'AND',
  },
  // {
  //   id: 'is079n',
  //   type: 'IntermediateEvent',
  //   width: 120,
  //   height: 150,
  //   label: 'Safety Belt Not Working',
  //   gate: 'OR',
  // },
  // {
  //   id: 'ht8wnb',
  //   type: 'IntermediateEvent',
  //   width: 120,
  //   height: 150,
  //   label: 'Fall By Accident',
  //   gate: 'OR',
  // },
  // {
  //   id: '07vhpd',
  //   type: 'IntermediateEvent',
  //   width: 120,
  //   height: 150,
  //   label: 'Broken By Equipment',
  //   gate: 'OR',
  // },
  // {
  //   id: 'd8ojep',
  //   type: 'IntermediateEvent',
  //   width: 120,
  //   height: 150,
  //   label: 'Did not Wear Safety Belt',
  //   gate: 'OR',
  // },
  // {
  //   id: 'szf1q3',
  //   type: 'UndevelopedEvent',
  //   width: 140,
  //   height: 80,
  //   label: 'Slip and Fall',
  // },
  // {
  //   id: 'kj5m9a',
  //   type: 'UndevelopedEvent',
  //   width: 140,
  //   height: 80,
  //   label: 'Lose Balance',
  // },
  // {
  //   id: 'tcv79r',
  //   type: 'UndevelopedEvent',
  //   width: 140,
  //   height: 80,
  //   label: 'Upholder Broken',
  // },
  // {
  //   id: 'ylp4gu',
  //   type: 'BasicEvent',
  //   width: 80,
  //   height: 80,
  //   label: 'Safety Belt Broken',
  // },
  // {
  //   id: 'q2vwnc',
  //   type: 'BasicEvent',
  //   width: 80,
  //   height: 80,
  //   label: 'Forgot to Wear',
  // },
  // {
  //   id: 'x8rboj',
  //   type: 'ExternalEvent',
  //   width: 80,
  //   height: 100,
  //   label: 'Take off When Walking',
  // },
  // {
  //   id: 'mte5xr',
  //   type: 'ConditioningEvent',
  //   width: 140,
  //   height: 80,
  //   label: 'Height and Ground Condition',
  // }
];

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function IntermediateEventNode({ id, label, width, height, gate }: Readonly<IntermediateEvent>) {

  const paper = usePaper();
  const { set } = useCellActions<FTAElement>();

  const bodySvgPath = useMemo(() => `M 10 0 H ${width - 10} l 10 10 V ${height - 90} l -10 10 H 10 l -10 -10 V 10 Z`, [width, height]);
  const gatePatternUrl = useMemo(() => {
    const patternId = paper.definePattern({
      id: 'gate-pattern',
      attrs: {
        width: 6,
        height: 6,
        'stroke-width': 1,
        'stroke-opacity': 0.3,
        stroke: '#dde6ed',
        fill: 'none',
      },
      markup: [
        {
          tagName: 'rect',
          attributes: {
            width: 6,
            height: 6,
            fill: '#131e29',
            stroke: 'none',
          },
        },
        {
          tagName: 'path',
          attributes: {
            d: 'M 3 0 L 3 6',
          },
        },
      ],
    });

    return `url(#${patternId})`;
  }, [paper]);

  const gateSvgPath = useMemo(() => {
    switch (gate) {
      case 'OR': {
        return 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0';
      }
      case 'XOR': {
        return 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0 M -20 0 0 -30 M 0 -30 20 0';
      }
      case 'AND': {
        return 'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z';
      }
      case 'PRIORITY_AND': {
        return 'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z M -20 0 0 -30 20 0';
      }
      case 'INHIBIT': {
        return 'M -10 0 -20 -15 -10 -30 10 -30 20 -15 10 0 Z';
      }
      case 'TRANSFER': {
        return 'M -20 0 20 0 0 -30 z';
      }
    }
  }, [gate]);

  const changeGate = useCallback(() => {
    const currentIndex = GATE_TYPES.indexOf(gate);
    const nextIndex = (currentIndex + 1) % GATE_TYPES.length;
    const nextGate = GATE_TYPES[nextIndex];

    set(id, (previous) => ({
      ...previous,
      gate: nextGate,
    }));
  }, [id, gate, set]);

  return (
    <>
      {/* Body */}
      <path d={bodySvgPath} stroke={PRIMARY} fill={BG} />
      {/* Gate */}
      <path
        stroke={LIGHT}
        fill={gatePatternUrl}
        fillRule='nonzero'
        cursor='pointer'
        d={gateSvgPath}
        transform={`translate(${width / 2}, ${height})`}
        onClick={changeGate}
      />
      {/* ID Body */}
      <rect
        width={width - 20}
        height={30}
        x={10}
        y={height - 70}
        fill={BG}
        stroke={LIGHT}
        strokeWidth={2}
      />
      {/* Label */}
      <TextNode
        width={width - 20}
        height={height - 90}
        fontSize={16}
        fontFamily='sans-serif'
        fill={TEXT}
        x={width / 2}
        y={height / 2 - 40}
        textWrap={{ ellipsis: true }}
        textAnchor='middle'
        textVerticalAnchor='middle'
      >
        {label}
      </TextNode>
      {/* ID Label */}
      <TextNode
        x={width / 2}
        y={height - 55}
        fontSize={14}
        fontFamily='sans-serif'
        fill={TEXT}
        textAnchor='middle'
        textVerticalAnchor='middle'
        annotations={[{ start: 4, end: 10, attrs: { fill: '#f6f740' } }]}
      >
        {`id: ${id}`}
      </TextNode>
    </>
  );
}

// ----------------------------------------------------------------------------
// Application Components
// ----------------------------------------------------------------------------
function Main() {
  const cellVisibilityCallback = useCallback((cell: dia.Cell) => {
    return !cell.prop('data/hidden');
  }, []);

  return (
    <Paper
      width="100%"
      className={PAPER_CLASSNAME}
      renderElement={IntermediateEventNode}
      cellVisibility={cellVisibilityCallback}
    />
  );
}

export default function App() {
  const mapDataToElementAttributes = useCallback(({ defaultAttributes }: ElementToGraphOptions<GraphElement>) => {
    return {
      ...defaultAttributes(),
      attrs: {
        root: { pointerEvents: 'bounding-box' },
      }
    };
  }, []);
  return (
    <GraphProvider
      elements={initialElements}
      mapDataToElementAttributes={mapDataToElementAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
