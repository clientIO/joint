/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import {
  GraphProvider,
  Paper,
  useGraph,
  useElements,
  useElementSize,
  type FlatElementData,
  type FlatLinkData,
  SVGText,
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
} as const;

interface GeneratorData {
  readonly [key: string]: unknown;
  readonly type: typeof ShapeTypes.generator;
  readonly power: number;
}

interface BulbData {
  readonly [key: string]: unknown;
  readonly type: typeof ShapeTypes.bulb;
  readonly watts: number;
}

type ShapeData = GeneratorData | BulbData;

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------
// Turbine geometry
const TURBINE_R = 16;
const TURBINE_A = 3;
const TURBINE_B = 4;

// Colors (derived from storybook theme)
const GENERATOR_BODY = '#8c1722';
const GENERATOR_STROKE = '#6e1019';
const GENERATOR_DARK = '#1a0508';
const GENERATOR_ACCENT = PRIMARY;
const GENERATOR_BLADE = LIGHT;

const BULB_GLASS = '#c0cdd6';
const BULB_GLASS_STROKE = '#7a8d99';
const BULB_CAP = BG;
const BULB_LIT_FILL = '#ffd580';
const BULB_LIT_STROKE = SECONDARY;

const WIRE_LINE = '#5c6f7a';
const WIRE_OUTLINE = BG;

// The generator element ID that controls power for the circuit
const GENERATOR_ID = 'generator';

// ----------------------------------------------------------------------------
// Initial Data
// ----------------------------------------------------------------------------
const initialElements: Record<string, FlatElementData<ShapeData>> = {
  generator: {
    data: { type: ShapeTypes.generator, power: 0.9 },
    position: { x: 50, y: 50 },
    size: { width: 60, height: 80 },
  },
  bulb1: {
    data: { type: ShapeTypes.bulb, watts: 100 },
    position: { x: 150, y: 45 },
    size: { width: 28, height: 30 },
  },
  bulb2: {
    data: { type: ShapeTypes.bulb, watts: 40 },
    position: { x: 150, y: 105 },
    size: { width: 28, height: 30 },
  },
};

const wireAppearance = {
  color: WIRE_LINE,
  width: 2,
  wrapperColor: WIRE_OUTLINE,
  wrapperWidth: 2,
  linecap: 'round' as const,
  linejoin: 'round' as const,
  z: -1,
};

const initialLinks: Record<string, FlatLinkData> = {
  wire1: {
    source: 'generator',
    target: 'bulb1',
    ...wireAppearance,
  },
  wire2: {
    source: 'generator',
    target: 'bulb2',
    ...wireAppearance,
  },
};

// ----------------------------------------------------------------------------
// Generator Component
// ----------------------------------------------------------------------------
function GeneratorNode({ power }: Readonly<GeneratorData>) {
  const { width, height } = useElementSize();
  const turbinePathRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const { setElement } = useGraph<ShapeData>();

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
    setElement(GENERATOR_ID, (previous) => ({
      ...previous,
      data: { ...(previous.data as unknown as GeneratorData), power: newPower },
    }));
  }, [power, setElement]);

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
      <SVGText
        x={width - 18}
        y={height - 5}
        fill="white"
        fontSize={7}
        fontFamily="sans-serif"
        textAnchor="end"
        textVerticalAnchor="bottom"
      >
        {powerText}
      </SVGText>
      {/* Label */}
      <SVGText
        x={width / 2}
        y={height + 10}
        fill={GENERATOR_DARK}
        fontSize={14}
        fontFamily="sans-serif"
        textAnchor="middle"
        textVerticalAnchor="top"
      >
        Generator
      </SVGText>
    </>
  );
}

// ----------------------------------------------------------------------------
// Bulb Component
// ----------------------------------------------------------------------------
function BulbNode({ watts }: Readonly<BulbData>) {
  const { width, height } = useElementSize();
  const glassRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<Animation | null>(null);

  // Read generator power from the store (reactive)
  const generatorPower = useElements<ShapeData, number>(
    (elements) => (elements.get(GENERATOR_ID) as GeneratorData)?.data?.power ?? 0
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
      <SVGText
        x={width / 2}
        y={height / 2}
        fill={GENERATOR_DARK}
        fontSize={7}
        fontFamily="sans-serif"
        textAnchor="middle"
        textVerticalAnchor="middle"
      >
        {`${watts} W`}
      </SVGText>
    </>
  );
}

// ----------------------------------------------------------------------------
// Render Dispatcher
// ----------------------------------------------------------------------------
function RenderShapeElement(props: Readonly<ShapeData>) {
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
  const { setElement } = useGraph<ShapeData>();

  // Read generator power from store (reactive)
  const power = useElements<ShapeData, number>(
    (elements) => (elements.get(GENERATOR_ID) as GeneratorData)?.data?.power ?? 0
  );

  const handlePowerChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newPower = event.target.valueAsNumber;
      setElement(GENERATOR_ID, (previous) => ({
        ...previous,
        data: { ...(previous.data as unknown as GeneratorData), power: newPower },
      }));
    },
    [setElement]
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
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Main />
    </GraphProvider>
  );
}
