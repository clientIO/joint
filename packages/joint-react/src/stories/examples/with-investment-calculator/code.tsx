/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { dia } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useCellActions,
  useCellId,
  useElements,
  useGraph,
  type OnLoadOptions,
  type GraphElement,
  type GraphLink,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { useCallback } from 'react';

import '../index.css';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type ShapeType = 'Investment' | 'Product' | 'ProductPerformance' | 'OverallPerformance';

interface BaseElement extends GraphElement {
  readonly type: ShapeType;
  readonly width: number;
  readonly height: number;
}

interface InvestmentElement extends BaseElement {
  readonly type: 'Investment';
  readonly funds: number;
  readonly year: number;
}

interface ProductElement extends BaseElement {
  readonly type: 'Product';
  readonly name: 'gold' | 'bitcoin' | 'sp500';
  readonly label: string;
  readonly percentage: number;
  readonly color: string;
}

interface ProductPerformanceElement extends BaseElement {
  readonly type: 'ProductPerformance';
  readonly label: string;
}

interface OverallPerformanceElement extends BaseElement {
  readonly type: 'OverallPerformance';
}

type ShapeElement =
  | InvestmentElement
  | ProductElement
  | ProductPerformanceElement
  | OverallPerformanceElement;

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const MAIN_COLOR = '#D4D9D7';
const SECONDARY_COLOR = '#EAECEA';
const BTC_COLOR = '#9C9EC8';
const GOLD_COLOR = '#F7E3AE';
const SP500_COLOR = '#FFCCD6';

const CURRENT_YEAR = 2023;
const INVESTMENT_ID = 'investment';
const PRODUCT_IDS = ['gold', 'bitcoin', 'sp500'] as const;

const DEFAULT_ROI_VALUE = { value: 0, roi: 0 };

const INPUT_CLASSNAME = 'box-border text-right my-1 w-full bg-white border border-gray-400 px-[2px] py-[1px] text-[13px] leading-none';

// Historical price data (2013-2023)
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
};

const YEARS = Object.keys(historicalPrices);

// ----------------------------------------------------------------------------
// Initial Data
// ----------------------------------------------------------------------------

const initialElements: Record<string, ShapeElement> = {
  investment: {
    type: 'Investment',
    x: 100,
    y: 280,
    width: 140,
    height: 225,
    z: 1,
    funds: 100,
    year: 2018,
  },
  gold: {
    type: 'Product',
    x: 300,
    y: 100,
    width: 140,
    height: 120,
    z: 3,
    name: 'gold',
    label: 'Gold',
    percentage: 25,
    color: GOLD_COLOR,
  },
  bitcoin: {
    type: 'Product',
    x: 300,
    y: 330,
    width: 140,
    height: 120,
    z: 5,
    name: 'bitcoin',
    label: 'Bitcoin',
    percentage: 25,
    color: BTC_COLOR,
  },
  sp500: {
    type: 'Product',
    x: 300,
    y: 560,
    width: 140,
    height: 120,
    z: 7,
    name: 'sp500',
    label: 'S&P 500',
    percentage: 50,
    color: SP500_COLOR,
  },
  goldPerf: {
    type: 'ProductPerformance',
    x: 600,
    y: 200,
    width: 200,
    height: 100,
    z: 0,
    label: 'Gold',
    parent: 'performance',
  },
  bitcoinPerf: {
    type: 'ProductPerformance',
    x: 600,
    y: 320,
    width: 200,
    height: 100,
    z: 0,
    label: 'Bitcoin',
    parent: 'performance',
  },
  sp500Perf: {
    type: 'ProductPerformance',
    x: 600,
    y: 440,
    width: 200,
    height: 100,
    z: 0,
    label: 'S&P 500',
    parent: 'performance',
  },
  performance: {
    type: 'OverallPerformance',
    x: 500,
    y: 300,
    width: 340,
    height: 400,
    z: -1,
  },
};

const linkAppearance = {
  width: 4,
  wrapperColor: '#000000',
  wrapperBuffer: 4,
  className: 'investment-link',
  targetMarker: {
    d: 'M 10 -2 10 -10 -3 0 10 10 10 2',
    stroke: '#000000',
    strokeWidth: 2,
  },
};

const initialLinks: Record<string, GraphLink> = {
  link1: {
    source: { id: 'investment', anchor: { name: 'top', args: { dy: 1 } } },
    target: { id: 'gold', anchor: { name: 'left', args: { dx: -5 } } },
    ...linkAppearance,
    color: MAIN_COLOR,
    z: 2,
  },
  link2: {
    source: {
      id: 'investment',
      anchor: { name: 'right', args: { dx: -1 } },
    },
    target: { id: 'bitcoin', anchor: { name: 'left', args: { dx: -5 } } },
    ...linkAppearance,
    color: MAIN_COLOR,
    z: 2,
  },
  link3: {
    source: {
      id: 'investment',
      anchor: { name: 'bottom', args: { dy: -1 } },
    },
    target: { id: 'sp500', anchor: { name: 'left', args: { dx: -5 } } },
    ...linkAppearance,
    color: MAIN_COLOR,
    z: 2,
  },
  link4: {
    source: { id: 'gold', anchor: { name: 'right', args: { dx: -1 } } },
    target: { id: 'goldPerf', anchor: { name: 'left', args: { dx: -5 } } },
    ...linkAppearance,
    color: GOLD_COLOR,
    z: 4,
  },
  link5: {
    source: { id: 'bitcoin', anchor: { name: 'right', args: { dx: -1 } } },
    target: {
      id: 'bitcoinPerf',
      anchor: { name: 'left', args: { dx: -5 } },
    },
    ...linkAppearance,
    color: BTC_COLOR,
    z: 5,
  },
  link6: {
    source: { id: 'sp500', anchor: { name: 'right', args: { dx: -1 } } },
    target: { id: 'sp500Perf', anchor: { name: 'left', args: { dx: -5 } } },
    ...linkAppearance,
    color: SP500_COLOR,
    z: 7,
  },
};

// ----------------------------------------------------------------------------
// Utility
// ----------------------------------------------------------------------------

function formatValue(value: number): string {
  return value.toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateProductValue(investment: InvestmentElement, product: ProductElement): number {
  const year = String(investment.year);
  const buyPrice = historicalPrices[year]?.[product.name] ?? 1;
  const sellPrice = historicalPrices[String(CURRENT_YEAR)]?.[product.name] ?? 1;
  return (investment.funds * product.percentage) / 100 * (sellPrice / buyPrice);
}

function calculateROI(cost: number, value: number): number {
  return cost === 0 ? 0 : ((value - cost) / cost) * 100;
}

// ----------------------------------------------------------------------------
// Investment Node
// ----------------------------------------------------------------------------

function InvestmentNode({ width, height, funds, year }: Readonly<InvestmentElement>) {
  const { set } = useCellActions<ShapeElement>();

  const handleFundsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.validity.valid) return;
      const newFunds = Number(event.target.value);
      set(INVESTMENT_ID, (previous) => ({ ...previous, funds: newFunds }));
    },
    [set]
  );

  const handleYearChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = Number(event.target.value);
      set(INVESTMENT_ID, (previous) => ({ ...previous, year: newYear }));
    },
    [set]
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill={MAIN_COLOR}
        stroke="#333333"
        strokeWidth={2}
      />
      <foreignObject width={width} height={height}>
        <div className="p-2.5 flex flex-col text-center text-black font-sans leading-none">
          <h2 className="my-4 font-bold text-[21px] text-black">Investment</h2>
          <div className="flex flex-col">
            <label className="mt-4 text-[14px]">
              How much did you invest?
              <input
                className={`${INPUT_CLASSNAME} mt-2.5`}
                type="number"
                value={funds}
                onChange={handleFundsChange}
              />
            </label>
          </div>
          <div className="flex flex-col">
            <label className="mt-4 text-[14px]">
              What year it was?
              <select
                className={`${INPUT_CLASSNAME} mt-2.5`}
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

function ProductNode({
  width,
  height,
  name,
  label,
  percentage,
  color,
}: Readonly<ProductElement>) {
  const { set } = useCellActions<ShapeElement>();

  const handlePercentageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.validity.valid) return;
      const newPercentage = Number(event.target.value);

      // Read all current product percentages for redistribution
      set(name, (previous) => ({ ...previous, percentage: newPercentage }));

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
        set(productId, (previous) => {
          if (previous.type !== 'Product') return previous;
          const adjusted = Math.max(previous.percentage + diff, 0);
          diff = Math.min(previous.percentage + diff, 0);
          return { ...previous, percentage: adjusted };
        });
      }
    },
    [set, name, percentage]
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill={color}
        stroke="#333333"
        strokeWidth={2}
      />
      <foreignObject width={width} height={height}>
        <div className="p-2.5 flex flex-col text-center text-black font-sans text-[14px] leading-none">
          <div className="flex flex-col">
            <label className="mt-4 text-[14px]">
              What percentage did you invest in <strong className="font-bold">{label}</strong>?
              <span className="flex flex-row items-center mt-2.5">
                <input
                  className={INPUT_CLASSNAME}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={percentage}
                  onChange={handlePercentageChange}
                />
                <span className="shrink-0 pl-1.5 text-right">%</span>
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

function ProductPerformanceNode({
  width,
  height,
  label,
}: Readonly<ProductPerformanceElement>) {
  const cellId = useCellId();
  const graph = useGraph();

  // Use graph topology to find the connected product (inbound neighbor via link)
  const { value, roi } = useElements<ShapeElement, { value: number; roi: number }>(
    (elements) => {
      const cell = graph.getCell(cellId);
      if (!cell?.isElement()) {
        return DEFAULT_ROI_VALUE;
      }

      const [productCell] = graph.getNeighbors(cell, { inbound: true });
      if (!productCell) {
        return DEFAULT_ROI_VALUE;
      }

      const investment = elements[INVESTMENT_ID];
      const product = elements[productCell.id];
      if (investment?.type !== 'Investment' || product?.type !== 'Product') {
        return DEFAULT_ROI_VALUE;
      }

      const productValue = calculateProductValue(investment, product);
      const cost = (investment.funds * product.percentage) / 100;
      return { value: productValue, roi: calculateROI(cost, productValue) };
    }
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill={MAIN_COLOR}
        stroke="#333333"
        strokeWidth={2}
      />
      <foreignObject width={width} height={height}>
        <div className="p-2.5 flex flex-col text-center text-black font-sans text-sm">
          <fieldset className="border-none m-0 p-0">
            <legend className="font-bold">
              {label}
            </legend>
            <div>
              <label className="flex items-center text-left">
                <span className="w-[30%] shrink-0">Value</span>
                <input
                  className={INPUT_CLASSNAME}
                  name="value"
                  type="text"
                  readOnly
                  value={formatValue(value)}
                />
              </label>
            </div>
            <div>
              <label className="flex items-center text-left">
                <span className="w-[30%] shrink-0">ROI</span>
                <input
                  className={INPUT_CLASSNAME}
                  name="roi"
                  type="text"
                  readOnly
                  value={formatValue(roi)}
                />
              </label>
            </div>
          </fieldset>
        </div>
      </foreignObject>
    </>
  );
}

// ----------------------------------------------------------------------------
// Overall Performance Node
// ----------------------------------------------------------------------------

function OverallPerformanceNode({
  width,
  height,
}: Readonly<OverallPerformanceElement>) {
  const cellId = useCellId();
  const graph = useGraph();

  // Use graph topology: walk embedded performance cells, find their inbound product neighbors
  const { value, roi } = useElements<ShapeElement, { value: number; roi: number }>(
    (elements) => {
      const investment = elements[INVESTMENT_ID];
      if (investment?.type !== 'Investment') {
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

        const product = elements[productCell.id];
        if (product?.type !== 'Product') continue;

        totalValue += calculateProductValue(investment, product);
      }

      return { value: totalValue, roi: calculateROI(investment.funds, totalValue) };
    }
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill={SECONDARY_COLOR}
        stroke="#333333"
        strokeWidth={2}
      />
      <foreignObject width={width} height={height}>
        <div className="p-2.5 flex flex-col justify-between text-center text-black font-sans text-[14px] h-full leading-none">
          <p className="my-3">
            This is your portfolio now in <strong className="font-bold">{CURRENT_YEAR}</strong>.
          </p>
          <fieldset className="border-none m-0 p-0">
            <legend className="mb-2.5">
              Your overall performance of investment is:
            </legend>
            <div>
              <label className="flex items-center text-left">
                <span className="w-[30%] shrink-0">Value</span>
                <input
                  className={INPUT_CLASSNAME}
                  name="value"
                  type="text"
                  readOnly
                  value={formatValue(value)}
                />
              </label>
            </div>
            <div>
              <label className="flex items-center text-left">
                <span className="w-[30%] shrink-0">ROI</span>
                <input
                  className={INPUT_CLASSNAME}
                  name="roi"
                  type="text"
                  readOnly
                  value={formatValue(roi)}
                />
              </label>
            </div>
          </fieldset>
        </div>
      </foreignObject>
    </>
  );
}

// ----------------------------------------------------------------------------
// Render Dispatcher
// ----------------------------------------------------------------------------

function RenderElement(props: Readonly<ShapeElement>) {
  switch (props.type) {
    case 'Investment': {
      return <InvestmentNode {...props} />;
    }
    case 'Product': {
      return <ProductNode {...props} />;
    }
    case 'ProductPerformance': {
      return <ProductPerformanceNode {...props} />;
    }
    case 'OverallPerformance': {
      return <OverallPerformanceNode {...props} />;
    }
  }
}

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

function Main() {
  const handleReady = useCallback(({ paper, graph }: OnLoadOptions) => {
    const performance = graph.getCell('performance');
    if (performance?.isElement()) {
      performance.fitEmbeds({
        padding: { left: 30, right: 30, top: 50, bottom: 130 },
      });
    }

    paper.transformToFitContent({
      useModelGeometry: true,
      padding: 10,
      maxScale: 1,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  }, []);

  return (
    <Paper
      width="100%"
      height={800}
      className={PAPER_CLASSNAME}
      renderElement={RenderElement}
      defaultConnector={{ name: 'curve' }}
      defaultConnectionPoint={{ name: 'anchor' }}
      background={{ color: '#f6f4f4' }}
      interactive={{ stopDelegation: false }}
      onElementsSizeReady={handleReady}
    />
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
    >
      <Main />
    </GraphProvider>
  );
}
