/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { dia } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useCellActions,
  useElements,
  type GraphElement,
  type GraphLink,
  type LinkToGraphOptions,
  TextNode,
} from '@joint/react';
import { BG, LIGHT, PAPER_CLASSNAME, PRIMARY, SECONDARY, TEXT } from 'storybook-config/theme';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import '../index.css';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
const ShapeTypes = {
  generator: 'generator',
  bulb: 'bulb',
  wire: 'wire',
} as const;

interface GeneratorElement extends GraphElement {
  readonly type: typeof ShapeTypes.generator;
  readonly width: number;
  readonly height: number;
  readonly power: number;
}

interface BulbElement extends GraphElement {
  readonly type: typeof ShapeTypes.bulb;
  readonly width: number;
  readonly height: number;
  readonly watts: number;
}

interface WireLink extends GraphLink {
  readonly type: typeof ShapeTypes.wire;
}

type ShapeElement = GeneratorElement | BulbElement;

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------
// Turbine geometry
const TURBINE_R = 16;
const TURBINE_A = 3;
const TURBINE_B = 4;

// Colors
const GENERATOR_BODY = '#945042';
const GENERATOR_STROKE = '#7f4439';
const GENERATOR_DARK = '#350100';
const GENERATOR_ACCENT = '#a95b4c';
const GENERATOR_BLADE = '#c99287';

const BULB_GLASS = '#f1f5f7';
const BULB_GLASS_STROKE = '#659db3';
const BULB_CAP = '#350100';
const BULB_LIT_FILL = '#f5e5b7';
const BULB_LIT_STROKE = '#edbc26';

const WIRE_LINE = '#346f83';
const WIRE_OUTLINE = '#004456';

// The generator element ID that controls power for the circuit
const GENERATOR_ID = 'generator';

// ----------------------------------------------------------------------------
// Initial Data
// ----------------------------------------------------------------------------
const initialElements: Record<string, ShapeElement> = {
  generator: {
    type: ShapeTypes.generator,
    x: 50,
    y: 50,
    width: 60,
    height: 80,
    power: 0.9,
  },
  bulb1: {
    type: ShapeTypes.bulb,
    x: 150,
    y: 45,
    width: 28,
    height: 30,
    watts: 100,
  },
  bulb2: {
    type: ShapeTypes.bulb,
    x: 150,
    y: 105,
    width: 28,
    height: 30,
    watts: 40,
  },
};

const initialLinks: Record<string, WireLink> = {
  wire1: {
    type: ShapeTypes.wire,
    source: 'generator',
    target: 'bulb1',
  },
  wire2: {
    type: ShapeTypes.wire,
    source: 'generator',
    target: 'bulb2',
  },
};

// ----------------------------------------------------------------------------
// Custom Attribute Mapper for Links
// ----------------------------------------------------------------------------
const mapDataToLinkAttributes = (
  options: LinkToGraphOptions<GraphLink>
): dia.Cell.JSON => {
  const result = options.toAttributes();
  return {
    ...result,
    z: -1,
    attrs: {
      line: {
        connection: true,
        stroke: WIRE_LINE,
        strokeWidth: 2,
        strokeLinejoin: 'round',
        strokeLinecap: 'round',
        targetMarker: null
      },
      outline: {
        connection: true,
        stroke: WIRE_OUTLINE,
        strokeWidth: 4,
        strokeLinejoin: 'round',
        strokeLinecap: 'round',
      },
    },
    markup: [
      { tagName: 'path', selector: 'outline', attributes: { fill: 'none' } },
      { tagName: 'path', selector: 'line', attributes: { fill: 'none' } },
    ],
  };
};

// ----------------------------------------------------------------------------
// Generator Component
// ----------------------------------------------------------------------------
function GeneratorNode({ width, height, power }: Readonly<GeneratorElement>) {
  const turbinePathRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const { set } = useCellActions<ShapeElement>();

  // Turbine blade path
  const turbinePath = `
    M ${TURBINE_A} ${TURBINE_A} ${TURBINE_B} ${TURBINE_R} -${TURBINE_B} ${TURBINE_R} -${TURBINE_A} ${TURBINE_A} -${TURBINE_R} ${TURBINE_B} -${TURBINE_R} -${TURBINE_B} -${TURBINE_A} -${TURBINE_A} -${TURBINE_B} -${TURBINE_R} ${TURBINE_B} -${TURBINE_R} ${TURBINE_A} -${TURBINE_A} ${TURBINE_R} -${TURBINE_B} ${TURBINE_R} ${TURBINE_B} Z`;

  // Initialize and control animation
  useEffect(() => {
    const turbineElement = turbinePathRef.current;
    if (!turbineElement) return;

    if (!animationRef.current) {
      const keyframes = { transform: ['rotate(0deg)', 'rotate(360deg)'] };
      animationRef.current = turbineElement.animate(keyframes, {
        fill: 'forwards',
        duration: 1000,
        iterations: Infinity,
      });
    }

    animationRef.current.playbackRate = power;
  }, [power]);

  // Power display text
  const powerText = useMemo(() => {
    const percent = Math.round(power * 100);
    if (percent === 0) return 'Off';
    if (percent === 100) return 'On';
    if (percent === 400) return 'Max';
    return `${percent} %`;
  }, [power]);

  const statusColor = power === 0 ? '#ed4912' : '#65b374';

  const handleTogglePower = useCallback(() => {
    const newPower = power === 0 ? 1 : 0;
    set(GENERATOR_ID, (previous) => ({ ...previous, power: newPower }));
  }, [power, set]);

  return (
    <>
      {/* Body */}
      <rect
        width={width}
        height={height}
        fill={GENERATOR_BODY}
        stroke={GENERATOR_STROKE}
        strokeWidth={2}
        rx={5}
        ry={5}
      />
      {/* Generator group */}
      <g transform={`translate(${width / 2}, ${height / 2})`}>
        {/* Background circle */}
        <circle r={24} fill={GENERATOR_DARK} stroke={GENERATOR_ACCENT} strokeWidth={2} />
        {/* Spinning turbine */}
        <path
          ref={turbinePathRef}
          d={turbinePath}
          fill={GENERATOR_BLADE}
          stroke={GENERATOR_ACCENT}
          strokeWidth={2}
        />
      </g>
      {/* Status indicator */}
      <circle
        cx={width - 10}
        cy={height - 10}
        r={5}
        fill={statusColor}
        stroke="white"
        cursor="pointer"
        onClick={handleTogglePower}
      />
      {/* Power readout */}
      <TextNode
        x={width - 18}
        y={height - 5}
        fill="white"
        fontSize={7}
        fontFamily="sans-serif"
        textAnchor="end"
        textVerticalAnchor="bottom"
      >
        {powerText}
      </TextNode>
      {/* Label */}
      <TextNode
        x={width / 2}
        y={height + 10}
        fill={LIGHT}
        fontSize={14}
        fontFamily="sans-serif"
        textAnchor="middle"
        textVerticalAnchor="top"
      >
        Generator
      </TextNode>
    </>
  );
}

// ----------------------------------------------------------------------------
// Bulb Component
// ----------------------------------------------------------------------------
function BulbNode({ width, height, watts }: Readonly<BulbElement>) {
  const glassRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<Animation | null>(null);

  // Read generator power from the store (reactive)
  const generatorPower = useElements<ShapeElement, number>(
    (elements) => (elements[GENERATOR_ID] as GeneratorElement)?.power ?? 0
  );

  // Compute light state from generator power (derived state)
  const light = Math.round(generatorPower * 100) >= watts;

  // Glass bulb path (scaled to fit width/height)
  const glassPath =
    'M 14.01 0 C 3.23 0.01 -3.49 11.68 1.91 21.01 C 2.93 22.78 4.33 24.31 6.01 25.48 L 6.01 32 L 22.01 32 L 22.01 25.48 C 30.85 19.31 29.69 5.89 19.93 1.32 C 18.08 0.45 16.06 0 14.01 0 Z';

  // Initialize and control light animation
  useEffect(() => {
    const glassElement = glassRef.current;
    if (!glassElement) return;

    if (!animationRef.current) {
      const keyframes = {
        stroke: [BULB_GLASS_STROKE, BULB_LIT_STROKE],
        fill: [BULB_GLASS, BULB_LIT_FILL],
        strokeWidth: [1, 2],
      };
      animationRef.current = glassElement.animate(keyframes, {
        fill: 'forwards',
        duration: 500,
        iterations: 1,
      });
    }

    animationRef.current.playbackRate = light ? 1 : -1;
  }, [light]);

  return (
    <>
      {/* Glass bulb */}
      <path ref={glassRef} d={glassPath} fill={BULB_GLASS} stroke={BULB_GLASS_STROKE} />
      {/* Cap 1 */}
      <rect x={width / 2 - 6} y={height + 1} width={12} height={3} fill={BULB_CAP} />
      {/* Cap 2 */}
      <rect x={width / 2 - 5} y={height + 5} width={10} height={3} fill={BULB_CAP} />
      {/* Wattage label */}
      <TextNode
        x={width / 2}
        y={height / 2}
        fill={GENERATOR_DARK}
        fontSize={7}
        fontFamily="sans-serif"
        textAnchor="middle"
        textVerticalAnchor="middle"
      >
        {`${watts} W`}
      </TextNode>
    </>
  );
}

// ----------------------------------------------------------------------------
// Render Dispatcher
// ----------------------------------------------------------------------------
function RenderShapeElement(props: Readonly<ShapeElement>) {
  switch (props.type) {
    case ShapeTypes.generator: {
      return <GeneratorNode {...props} />;
    }
    case ShapeTypes.bulb: {
      return <BulbNode {...props} />;
    }
  }
}

// ----------------------------------------------------------------------------
// Power Control Component
// ----------------------------------------------------------------------------
function PowerControl() {
  const { set } = useCellActions<ShapeElement>();

  // Read generator power from store (reactive)
  const power = useElements<ShapeElement, number>(
    (elements) => (elements[GENERATOR_ID] as GeneratorElement)?.power ?? 0
  );

  const handlePowerChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newPower = event.target.valueAsNumber;
      set(GENERATOR_ID, (previous) => ({ ...previous, power: newPower }));
    },
    [set]
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: BG,
        borderRadius: 8,
        marginTop: 16,
      }}
    >
      <label
        htmlFor="power-input"
        style={{
          color: TEXT,
          fontFamily: 'sans-serif',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        Power
      </label>
      <input
        type="range"
        id="power-input"
        min={0}
        max={4}
        step={0.1}
        value={power}
        onChange={handlePowerChange}
        style={{
          flex: 1,
          accentColor: PRIMARY,
        }}
      />
      <output
        htmlFor="power-input"
        style={{
          color: SECONDARY,
          fontFamily: 'monospace',
          fontSize: 14,
          minWidth: 50,
          textAlign: 'right',
        }}
      >
        {power.toFixed(1)} x
      </output>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Paper
        width="100%"
        height={500}
        className={PAPER_CLASSNAME}
        renderElement={RenderShapeElement}
        scale={3}
        defaultAnchor={{ name: 'perpendicular' }}
        defaultConnectionPoint={{ name: 'rectangle', args: { useModelGeometry: true } }}
        interactive={{
          linkMove: false,
        }}
      />
      <PowerControl />
    </div>
  );
}

// ----------------------------------------------------------------------------
// App Export
// ----------------------------------------------------------------------------
export default function App() {
  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      mapDataToLinkAttributes={mapDataToLinkAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
