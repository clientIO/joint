import { useCallback, useEffect, useRef } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import {
  GraphProvider,
  Paper,
  SVGText,
  linkRoutingStraight,
  selectElementSize,
  useCell,
  useCells,
  useGraph,
} from '@joint/react';
import type { CellRecord, Computed, ElementRecord } from '@joint/react';

const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const BG = '#131E29';
const LIGHT = '#DDE6ED';

const STRAIGHT_LINKS = linkRoutingStraight({ perpendicular: true });

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

// The generator whose power drives the whole circuit.
const GENERATOR_ID = 'generator';

const TURBINE_R = 16;
const TURBINE_A = 3;
const TURBINE_B = 4;
const TURBINE_PATH = `M ${TURBINE_A} ${TURBINE_A} ${TURBINE_B} ${TURBINE_R} -${TURBINE_B} ${TURBINE_R} -${TURBINE_A} ${TURBINE_A} -${TURBINE_R} ${TURBINE_B} -${TURBINE_R} -${TURBINE_B} -${TURBINE_A} -${TURBINE_A} -${TURBINE_B} -${TURBINE_R} ${TURBINE_B} -${TURBINE_R} ${TURBINE_A} -${TURBINE_A} ${TURBINE_R} -${TURBINE_B} ${TURBINE_R} ${TURBINE_B} Z`;

const BULB_GLASS_PATH =
  'M 14.01 0 C 3.23 0.01 -3.49 11.68 1.91 21.01 C 2.93 22.78 4.33 24.31 6.01 25.48 L 6.01 32 L 22.01 32 L 22.01 25.48 C 30.85 19.31 29.69 5.89 19.93 1.32 C 18.08 0.45 16.06 0 14.01 0 Z';

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

const WIRE_LINE = '#8697A6';
const WIRE_OUTLINE = BG;

const STATUS_OFF = PRIMARY;
const STATUS_ON = '#36A18B';

const RANGE_STYLE: CSSProperties = { flex: 1, accentColor: PRIMARY };

const wireStyle = {
  color: WIRE_LINE,
  width: 2,
  wrapperColor: WIRE_OUTLINE,
  wrapperWidth: 2,
  linecap: 'round' as const,
  linejoin: 'round' as const,
};

const initialCells: ReadonlyArray<CellRecord<ShapeData>> = [
  {
    id: GENERATOR_ID,
    type: 'element',
    data: { type: ShapeTypes.generator, power: 0.9 },
    position: { x: 50, y: 50 },
    size: { width: 60, height: 80 },
  },
  {
    id: 'bulb1',
    type: 'element',
    data: { type: ShapeTypes.bulb, watts: 100 },
    position: { x: 150, y: 45 },
    size: { width: 28, height: 30 },
  },
  {
    id: 'bulb2',
    type: 'element',
    data: { type: ShapeTypes.bulb, watts: 40 },
    position: { x: 150, y: 105 },
    size: { width: 28, height: 30 },
  },
  {
    id: 'wire1',
    type: 'link',
    source: { id: GENERATOR_ID },
    target: { id: 'bulb1' },
    style: wireStyle,
    z: -1,
  },
  {
    id: 'wire2',
    type: 'link',
    source: { id: GENERATOR_ID },
    target: { id: 'bulb2' },
    style: wireStyle,
    z: -1,
  },
];

/** Human-readable label for the generator's power multiplier. */
function formatPower(power: number): string {
  const percent = Math.round(power * 100);
  if (percent === 0) return 'Off';
  if (percent === 100) return 'On';
  if (percent === 400) return 'Max';
  return `${percent} %`;
}

/** Reactively read the generator's current power from the graph. */
function useGeneratorPower(): number {
  return useCells<Computed<ElementRecord<ShapeData>>, number>((cells) => {
    const generator = cells.find((cell) => cell.id === GENERATOR_ID);
    const data = generator?.data;
    return data?.type === ShapeTypes.generator ? data.power : 0;
  });
}

/** Returns a stable setter that writes a new power onto the generator cell. */
function useSetGeneratorPower(): (power: number) => void {
  const { setCell, isElement } = useGraph<ElementRecord<ShapeData>>();
  return useCallback(
    (power: number) => {
      setCell(GENERATOR_ID, (previous) => {
        if (!isElement(previous)) return previous;
        return { ...previous, data: { type: ShapeTypes.generator, power } };
      });
    },
    [setCell, isElement]
  );
}

function GeneratorNode({ power }: Readonly<GeneratorData>) {
  const { width, height } = useCell(selectElementSize);
  const turbineRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const setPower = useSetGeneratorPower();

  // Create the endless spin once, then drive its speed via playbackRate.
  useEffect(() => {
    const turbine = turbineRef.current;
    if (!turbine) return;
    if (!animationRef.current) {
      animationRef.current = turbine.animate(
        { transform: ['rotate(0deg)', 'rotate(360deg)'] },
        { fill: 'forwards', duration: 1000, iterations: Infinity }
      );
    }
    animationRef.current.playbackRate = power;
  }, [power]);

  const togglePower = useCallback(() => setPower(power === 0 ? 1 : 0), [power, setPower]);

  return (
    <>
      <rect
        width={width}
        height={height}
        fill={GENERATOR_BODY}
        stroke={GENERATOR_STROKE}
        strokeWidth={2}
        rx={5}
        ry={5}
      />
      <g transform={`translate(${width / 2}, ${height / 2})`}>
        <circle r={24} fill={GENERATOR_DARK} stroke={GENERATOR_ACCENT} strokeWidth={2} />
        <path
          ref={turbineRef}
          d={TURBINE_PATH}
          fill={GENERATOR_BLADE}
          stroke={GENERATOR_ACCENT}
          strokeWidth={2}
        />
      </g>
      <circle
        cx={width - 10}
        cy={height - 10}
        r={5}
        fill={power === 0 ? STATUS_OFF : STATUS_ON}
        stroke={LIGHT}
        cursor="pointer"
        onClick={togglePower}
      />
      <SVGText
        x={width - 18}
        y={height - 5}
        fill={LIGHT}
        fontSize={7}
        fontFamily="sans-serif"
        textAnchor="end"
        textVerticalAnchor="bottom"
      >
        {formatPower(power)}
      </SVGText>
      <SVGText
        x={width / 2}
        y={height + 10}
        fill={LIGHT}
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

function BulbNode({ watts }: Readonly<BulbData>) {
  const { width, height } = useCell(selectElementSize);
  const glassRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const generatorPower = useGeneratorPower();

  // A bulb lights once the generator's power reaches its wattage threshold.
  const isLit = Math.round(generatorPower * 100) >= watts;

  // Create the on/off tween once, then play it forwards (lit) or backwards (off).
  useEffect(() => {
    const glass = glassRef.current;
    if (!glass) return;
    if (!animationRef.current) {
      animationRef.current = glass.animate(
        {
          stroke: [BULB_GLASS_STROKE, BULB_LIT_STROKE],
          fill: [BULB_GLASS, BULB_LIT_FILL],
          strokeWidth: [1, 2],
        },
        { fill: 'forwards', duration: 500, iterations: 1 }
      );
    }
    animationRef.current.playbackRate = isLit ? 1 : -1;
  }, [isLit]);

  return (
    <>
      <path ref={glassRef} d={BULB_GLASS_PATH} fill={BULB_GLASS} stroke={BULB_GLASS_STROKE} />
      <rect x={width / 2 - 6} y={height + 1} width={12} height={3} fill={BULB_CAP} />
      <rect x={width / 2 - 5} y={height + 5} width={10} height={3} fill={BULB_CAP} />
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

function RenderShapeElement(data: Readonly<ShapeData>) {
  switch (data.type) {
    case ShapeTypes.generator: {
      return <GeneratorNode {...data} />;
    }
    case ShapeTypes.bulb: {
      return <BulbNode {...data} />;
    }
  }
}

function PowerControl() {
  const power = useGeneratorPower();
  const setPower = useSetGeneratorPower();

  const handlePowerChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPower(event.target.valueAsNumber),
    [setPower]
  );

  return (
    <div className="jj-controls m-3">
      <label htmlFor="power-input" className="jj-label">
        Power
      </label>
      <input
        id="power-input"
        type="range"
        min={0}
        max={4}
        step={0.1}
        value={power}
        onChange={handlePowerChange}
        style={RANGE_STYLE}
      />
      <output htmlFor="power-input" className="jj-chip">
        {power.toFixed(1)} x
      </output>
    </div>
  );
}

function Main() {
  return (
    <div className="flex size-full flex-col">
      <Paper
        className="min-h-0 flex-1"
        renderElement={RenderShapeElement}
        transform="scale(3)"
        linkRouting={STRAIGHT_LINKS}
      />
      <PowerControl />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
