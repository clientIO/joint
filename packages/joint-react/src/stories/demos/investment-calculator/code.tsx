/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { dia } from '@joint/core';
import {
  type CellRecord,
  GraphProvider,
  Paper,
  useCell,
  useCellId,
  useCells,
  useGraph,
  type ElementRecord,
  type LinkRecord,
  type Computed,
  selectElementSize,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { linkRoutingSmooth } from '@joint/react/presets';
import { useCallback, useEffect, useRef } from 'react';

const SMOOTH_LINKS = linkRoutingSmooth();

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type InvestmentData = {
  readonly type: 'Investment';
  readonly funds: number;
  readonly year: number;
};

type ProductData = {
  readonly type: 'Product';
  readonly name: 'gold' | 'bitcoin' | 'sp500';
  readonly label: string;
  readonly percentage: number;
  readonly color: string;
};

type ProductPerformanceData = {
  readonly type: 'ProductPerformance';
  readonly label: string;
};

type OverallPerformanceData = {
  readonly type: 'OverallPerformance';
};

type ShapeData = InvestmentData | ProductData | ProductPerformanceData | OverallPerformanceData;

type ShapeElement = ElementRecord<ShapeData>;

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const MAIN_COLOR = '#1e293b';
const MAIN_BORDER = '#334155';
const SECONDARY_COLOR = '#0f172a';
const BTC_COLOR = '#f59e0b';
const GOLD_COLOR = '#eab308';
const SP500_COLOR = '#3b82f6';
const TEXT_COLOR = '#e2e8f0';
const TEXT_MUTED = '#94a3b8';
const LINK_COLOR = '#475569';

const CURRENT_YEAR = 2026;
const INVESTMENT_ID = 'investment';
const PRODUCT_IDS = ['gold', 'bitcoin', 'sp500'] as const;

const DEFAULT_ROI_VALUE = { value: 0, roi: 0 };

const INPUT_CLASSNAME =
  'box-border text-right my-1 w-full bg-slate-800 border border-slate-600 text-slate-200 rounded px-1.5 py-[3px] text-[13px] leading-none focus:border-blue-400 focus:outline-none';

// Historical price data (2013-2026) — Jan average prices
const historicalPrices: Record<string, Record<string, number>> = {
  '2013': { gold: 1685.5, bitcoin: 13.51, sp500: 1480.4 },
  '2014': { gold: 1219.75, bitcoin: 771.4, sp500: 1822.36 },
  '2015': { gold: 1184.25, bitcoin: 314.25, sp500: 2028.18 },
  '2016': { gold: 1060.2, bitcoin: 434.33, sp500: 1918.6 },
  '2017': { gold: 1162, bitcoin: 998.33, sp500: 2275.12 },
  '2018': { gold: 1312.8, bitcoin: 13_657.2, sp500: 2789.8 },
  '2019': { gold: 1287.2, bitcoin: 3800, sp500: 2607.39 },
  '2020': { gold: 1520.55, bitcoin: 7197.92, sp500: 3278.2 },
  '2021': { gold: 1947.6, bitcoin: 29_624.63, sp500: 3793.75 },
  '2022': { gold: 1800.1, bitcoin: 47_434.29, sp500: 4573.82 },
  '2023': { gold: 1824.16, bitcoin: 16_610.44, sp500: 3960.66 },
  '2024': { gold: 2063.73, bitcoin: 42_850, sp500: 4769.83 },
  '2025': { gold: 2632.78, bitcoin: 94_500, sp500: 5881.63 },
  '2026': { gold: 3025, bitcoin: 84_350, sp500: 5560 },
};

const YEARS = Object.keys(historicalPrices);

// ----------------------------------------------------------------------------
// Initial Data
// ----------------------------------------------------------------------------

const initialElements: ShapeElement[] = [
  {
    id: 'investment',
    type: 'element',
    data: { type: 'Investment', funds: 100, year: 2018 },
    position: { x: 100, y: 280 },
    size: { width: 140, height: 225 },
    z: 1,
  },
  {
    id: 'gold',
    type: 'element',
    data: { type: 'Product', name: 'gold', label: 'Gold', percentage: 25, color: GOLD_COLOR },
    position: { x: 300, y: 100 },
    size: { width: 140, height: 120 },
    z: 3,
  },
  {
    id: 'bitcoin',
    type: 'element',
    data: { type: 'Product', name: 'bitcoin', label: 'Bitcoin', percentage: 25, color: BTC_COLOR },
    position: { x: 300, y: 330 },
    size: { width: 140, height: 120 },
    z: 5,
  },
  {
    id: 'sp500',
    type: 'element',
    data: { type: 'Product', name: 'sp500', label: 'S&P 500', percentage: 50, color: SP500_COLOR },
    position: { x: 300, y: 560 },
    size: { width: 140, height: 120 },
    z: 7,
  },
  {
    id: 'goldPerf',
    type: 'element',
    data: { type: 'ProductPerformance', label: 'Gold' },
    position: { x: 600, y: 200 },
    size: { width: 200, height: 115 },
    z: 0,
    parent: 'performance',
  },
  {
    id: 'bitcoinPerf',
    type: 'element',
    data: { type: 'ProductPerformance', label: 'Bitcoin' },
    position: { x: 600, y: 320 },
    size: { width: 200, height: 115 },
    z: 0,
    parent: 'performance',
  },
  {
    id: 'sp500Perf',
    type: 'element',
    data: { type: 'ProductPerformance', label: 'S&P 500' },
    position: { x: 600, y: 440 },
    size: { width: 200, height: 115 },
    z: 0,
    parent: 'performance',
  },
  {
    id: 'performance',
    type: 'element',
    data: { type: 'OverallPerformance' },
    // The position and size of this element will be adjusted to fit its embedded performance nodes
    z: -1,
  },
];

const DEFAULT_LINK_STYLE = {
  width: 2,
  linecap: 'butt' as const,
  sourceMarker: 'circle' as const,
  targetMarker: 'arrow' as const,
};

const initialLinks: LinkRecord[] = [
  {
    id: 'link1',
    type: 'link',
    source: { id: 'investment', anchor: { name: 'top', args: { dy: 1 } } },
    target: { id: 'gold', anchor: { name: 'left', args: { dx: -5 } } },
    style: { color: LINK_COLOR, ...DEFAULT_LINK_STYLE },
    z: 2,
  },
  {
    id: 'link2',
    type: 'link',
    source: { id: 'investment', anchor: { name: 'right', args: { dx: -1 } } },
    target: { id: 'bitcoin', anchor: { name: 'left', args: { dx: -5 } } },
    style: { color: LINK_COLOR, ...DEFAULT_LINK_STYLE },
    z: 2,
  },
  {
    id: 'link3',
    type: 'link',
    source: { id: 'investment', anchor: { name: 'bottom', args: { dy: -1 } } },
    target: { id: 'sp500', anchor: { name: 'left', args: { dx: -5 } } },
    style: { color: LINK_COLOR, ...DEFAULT_LINK_STYLE },
    z: 2,
  },
  {
    id: 'link4',
    type: 'link',
    source: { id: 'gold', anchor: { name: 'right', args: { dx: -1 } } },
    target: { id: 'goldPerf', anchor: { name: 'left', args: { dx: -5 } } },
    style: { color: GOLD_COLOR, ...DEFAULT_LINK_STYLE },
    z: 4,
  },
  {
    id: 'link5',
    type: 'link',
    source: { id: 'bitcoin', anchor: { name: 'right', args: { dx: -1 } } },
    target: { id: 'bitcoinPerf', anchor: { name: 'left', args: { dx: -5 } } },
    style: { color: BTC_COLOR, ...DEFAULT_LINK_STYLE },
    z: 5,
  },
  {
    id: 'link6',
    type: 'link',
    source: { id: 'sp500', anchor: { name: 'right', args: { dx: -1 } } },
    target: { id: 'sp500Perf', anchor: { name: 'left', args: { dx: -5 } } },
    style: { color: SP500_COLOR, ...DEFAULT_LINK_STYLE },
    z: 7,
  },
];

const initialCells: ReadonlyArray<CellRecord<ShapeData>> = [...initialElements, ...initialLinks];

// ----------------------------------------------------------------------------
// Utility
// ----------------------------------------------------------------------------

function formatValue(value: number): string {
  return value.toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateProductValue(investment: InvestmentData, product: ProductData): number {
  const year = String(investment.year);
  const buyPrice = historicalPrices[year]?.[product.name] ?? 1;
  const sellPrice = historicalPrices[String(CURRENT_YEAR)]?.[product.name] ?? 1;
  return ((investment.funds * product.percentage) / 100) * (sellPrice / buyPrice);
}

function calculateROI(cost: number, value: number): number {
  return cost === 0 ? 0 : ((value - cost) / cost) * 100;
}

// ----------------------------------------------------------------------------
// Investment Node
// ----------------------------------------------------------------------------

function InvestmentNode({ funds, year }: Readonly<InvestmentData>) {
  const { setCell, isElement } = useGraph<ElementRecord<ShapeData>>();
  const { width, height } = useCell(selectElementSize);

  const handleFundsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.validity.valid) return;
      const newFunds = Number(event.target.value);
      setCell(INVESTMENT_ID, (previous) => {
        if (!isElement(previous)) return previous;
        if (previous.data?.type !== 'Investment') return previous;
        return {
          ...previous,
          data: { ...previous.data, funds: newFunds },
        };
      });
    },
    [setCell, isElement]
  );

  const handleYearChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = Number(event.target.value);
      setCell(INVESTMENT_ID, (previous) => {
        if (!isElement(previous)) return previous;
        if (previous.data?.type !== 'Investment') return previous;
        return {
          ...previous,
          data: { ...previous.data, year: newYear },
        };
      });
    },
    [setCell, isElement]
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={12}
        ry={12}
        fill={MAIN_COLOR}
        stroke={MAIN_BORDER}
        strokeWidth={1}
      />
      <foreignObject width={width} height={height}>
        <div
          className="p-3 flex flex-col text-center font-sans leading-none"
          style={{ color: TEXT_COLOR }}
        >
          <h2
            className="mt-3 mb-5 font-semibold text-lg tracking-tight"
            style={{ color: TEXT_COLOR }}
          >
            Investment
          </h2>
          <div className="flex flex-col">
            <label className="text-[13px]" style={{ color: TEXT_MUTED }}>
              Amount ($)
              <input
                className={`${INPUT_CLASSNAME} mt-1.5`}
                type="number"
                value={funds}
                onChange={handleFundsChange}
              />
            </label>
          </div>
          <div className="flex flex-col mt-3">
            <label className="text-[13px]" style={{ color: TEXT_MUTED }}>
              Year
              <select
                className={`${INPUT_CLASSNAME} mt-1.5`}
                value={year}
                onChange={handleYearChange}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </foreignObject>
    </>
  );
}

// ----------------------------------------------------------------------------
// Product Node
// ----------------------------------------------------------------------------

function ProductNode({ name, label, percentage, color }: Readonly<ProductData>) {
  const { setCell, isElement } = useGraph<ElementRecord<ShapeData>>();
  const { width, height } = useCell(selectElementSize);

  const handlePercentageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.validity.valid) return;
      const newPercentage = Number(event.target.value);

      // Read all current product percentages for redistribution
      setCell(name, (previous) => {
        if (!isElement(previous)) return previous;
        if (previous.data?.type !== 'Product') return previous;
        return {
          ...previous,
          data: { ...previous.data, percentage: newPercentage },
        };
      });

      // Redistribute the difference among other products
      const currentPercentage = percentage;
      let diff = currentPercentage - newPercentage;
      const currentIndex = PRODUCT_IDS.indexOf(name);

      // Products after the changed one, then wrap around
      const sortedIds = [
        ...PRODUCT_IDS.slice(currentIndex + 1),
        ...PRODUCT_IDS.slice(0, currentIndex),
      ];

      for (const productId of sortedIds) {
        if (diff === 0) break;
        setCell(productId, (previous) => {
          if (!isElement(previous)) return previous;
          const { data } = previous;
          if (data?.type !== 'Product') return previous;
          const previousPercentage = data.percentage;
          const adjusted = Math.max(previousPercentage + diff, 0);
          diff = Math.min(previousPercentage + diff, 0);
          return {
            ...previous,
            data: { ...data, percentage: adjusted },
          };
        });
      }
    },
    [setCell, isElement, name, percentage]
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={12}
        ry={12}
        fill={MAIN_COLOR}
        stroke={MAIN_BORDER}
        strokeWidth={1}
      />
      <foreignObject width={width} height={height}>
        <div
          className="p-3 flex flex-col text-center font-sans text-[13px] leading-none"
          style={{ color: TEXT_COLOR }}
        >
          <div className="flex items-center justify-center gap-1.5 mt-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            <span className="font-semibold text-sm" style={{ color: TEXT_COLOR }}>
              {label}
            </span>
          </div>
          <div className="flex flex-col">
            <label className="text-[13px]" style={{ color: TEXT_MUTED }}>
              Allocation
              <span className="flex flex-row items-center mt-1.5">
                <input
                  className={INPUT_CLASSNAME}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={percentage}
                  onChange={handlePercentageChange}
                />
                <span className="shrink-0 pl-1.5 text-right" style={{ color: TEXT_MUTED }}>
                  %
                </span>
              </span>
            </label>
          </div>
        </div>
      </foreignObject>
    </>
  );
}

// ----------------------------------------------------------------------------
// Product Performance Node
// ----------------------------------------------------------------------------

function ProductPerformanceNode({ label }: Readonly<ProductPerformanceData>) {
  const cellId = useCellId();
  const { graph } = useGraph();
  const { width, height } = useCell(selectElementSize);

  // Use graph topology to find the connected product (inbound neighbor via link)
  const { value, roi } = useCells<Computed<ElementRecord<ShapeData>>, typeof DEFAULT_ROI_VALUE>(
    (cells) => {
      const cell = graph.getCell(cellId);
      if (!cell?.isElement()) {
        return DEFAULT_ROI_VALUE;
      }

      const [productCell] = graph.getNeighbors(cell, { inbound: true });
      if (!productCell) {
        return DEFAULT_ROI_VALUE;
      }

      const investmentItem = cells.find((c) => String(c.id) === INVESTMENT_ID) as
        | ElementRecord<ShapeData>
        | undefined;
      const productItem = cells.find((c) => String(c.id) === String(productCell.id)) as
        | ElementRecord<ShapeData>
        | undefined;
      const investmentData = investmentItem?.data;
      const productData = productItem?.data;
      if (investmentData?.type !== 'Investment' || productData?.type !== 'Product') {
        return DEFAULT_ROI_VALUE;
      }
      const productValue = calculateProductValue(investmentData, productData);
      const cost = (investmentData.funds * productData.percentage) / 100;
      return { value: productValue, roi: calculateROI(cost, productValue) };
    }
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={12}
        ry={12}
        fill={MAIN_COLOR}
        stroke={MAIN_BORDER}
        strokeWidth={1}
      />
      <foreignObject width={width} height={height}>
        <div
          className="p-3 flex flex-col text-center font-sans text-[13px]"
          style={{ color: TEXT_COLOR }}
        >
          <p className="font-semibold text-sm mt-1 mb-2" style={{ color: TEXT_COLOR }}>
            {label}
          </p>
          <div className="flex flex-col gap-1">
            <label className="flex items-center text-left">
              <span className="w-[30%] shrink-0 text-[12px]" style={{ color: TEXT_MUTED }}>
                Value
              </span>
              <input
                className={INPUT_CLASSNAME}
                name="value"
                type="text"
                readOnly
                value={formatValue(value)}
              />
            </label>
            <label className="flex items-center text-left">
              <span className="w-[30%] shrink-0 text-[12px]" style={{ color: TEXT_MUTED }}>
                ROI
              </span>
              <input
                className={INPUT_CLASSNAME}
                name="roi"
                type="text"
                readOnly
                value={formatValue(roi)}
              />
            </label>
          </div>
        </div>
      </foreignObject>
    </>
  );
}

// ----------------------------------------------------------------------------
// Overall Performance Node
// ----------------------------------------------------------------------------

function OverallPerformanceNode(_props: Readonly<OverallPerformanceData>) {
  const cellId = useCellId();
  const { graph } = useGraph();
  const { width, height } = useCell(selectElementSize);

  // Use graph topology: walk embedded performance cells, find their inbound product neighbors
  const { value, roi } = useCells<Computed<ElementRecord<ShapeData>>, typeof DEFAULT_ROI_VALUE>(
    (cells) => {
      const investmentItem = cells.find((c) => String(c.id) === INVESTMENT_ID) as
        | ElementRecord<ShapeData>
        | undefined;
      const investmentData = investmentItem?.data;
      if (investmentData?.type !== 'Investment') {
        return DEFAULT_ROI_VALUE;
      }

      const cell = graph.getCell(cellId);
      if (!cell?.isElement()) {
        return DEFAULT_ROI_VALUE;
      }

      const embeddedCells = cell.getEmbeddedCells().filter((c): c is dia.Element => c.isElement());

      let totalValue = 0;
      for (const embeddedCell of embeddedCells) {
        const [productCell] = graph.getNeighbors(embeddedCell, { inbound: true });
        if (!productCell) continue;

        const productItem = cells.find((c) => String(c.id) === String(productCell.id)) as
          | ElementRecord<ShapeData>
          | undefined;
        const productData = productItem?.data;
        if (productData?.type !== 'Product') continue;
        totalValue += calculateProductValue(investmentData, productData);
      }

      return { value: totalValue, roi: calculateROI(investmentData.funds, totalValue) };
    }
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={12}
        ry={12}
        fill={SECONDARY_COLOR}
        stroke={MAIN_BORDER}
        strokeWidth={1}
      />
      <foreignObject width={width} height={height}>
        <div
          className="p-3 flex flex-col justify-between text-center font-sans text-[13px] h-full leading-none"
          style={{ color: TEXT_COLOR }}
        >
          <p className="mt-3 mb-2" style={{ color: TEXT_MUTED }}>
            Portfolio value in{' '}
            <strong className="font-semibold" style={{ color: TEXT_COLOR }}>
              {CURRENT_YEAR}
            </strong>
          </p>
          <div className="flex flex-col gap-1">
            <p className="text-[12px] mb-1" style={{ color: TEXT_MUTED }}>
              Overall performance
            </p>
            <label className="flex items-center text-left">
              <span className="w-[30%] shrink-0 text-[12px]" style={{ color: TEXT_MUTED }}>
                Value
              </span>
              <input
                className={INPUT_CLASSNAME}
                name="value"
                type="text"
                readOnly
                value={formatValue(value)}
              />
            </label>
            <label className="flex items-center text-left">
              <span className="w-[30%] shrink-0 text-[12px]" style={{ color: TEXT_MUTED }}>
                ROI
              </span>
              <input
                className={INPUT_CLASSNAME}
                name="roi"
                type="text"
                readOnly
                value={formatValue(roi)}
              />
            </label>
          </div>
        </div>
      </foreignObject>
    </>
  );
}

// ----------------------------------------------------------------------------
// Render Dispatcher
// ----------------------------------------------------------------------------

function RenderElement(data: Readonly<ShapeData>) {
  switch (data.type) {
    case 'Investment': {
      return <InvestmentNode {...data} />;
    }
    case 'Product': {
      return <ProductNode {...data} />;
    }
    case 'ProductPerformance': {
      return <ProductPerformanceNode {...data} />;
    }
    case 'OverallPerformance': {
      return <OverallPerformanceNode {...data} />;
    }
  }
}

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

function Main() {
  const paperRef = useRef<dia.Paper | null>(null);
  const { graph } = useGraph();

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    // Resize the container elements to fit their content
    // (performance nodes should fit their embedded product nodes)
    for (const element of graph.getElements()) {
      if (element.getEmbeddedCells().length > 0) {
        element.fitEmbeds({
          padding: { left: 30, right: 30, top: 50, bottom: 130 },
        });
      }
    }

    paper.transformToFitContent({
      useModelGeometry: true,
      padding: 10,
      maxScale: 1,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  }, [graph]);

  return (
    <Paper
      ref={paperRef}
      width="100%"
      height={800}
      className={PAPER_CLASSNAME}
      renderElement={RenderElement}
      linkRouting={SMOOTH_LINKS}
      style={{ backgroundColor: '#0f172a' }}
      interactive={{ stopDelegation: false }}
    />
  );
}

// ----------------------------------------------------------------------------
// App Export
// ----------------------------------------------------------------------------

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
