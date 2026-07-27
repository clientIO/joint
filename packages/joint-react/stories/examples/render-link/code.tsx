import {
  type CellRecord,
  GraphProvider,
  Paper,
  useCellId,
  useLinkLayout,
  type RenderLink,
} from '@joint/react';
import { useCallback, useState } from 'react';

const PRIMARY = '#ED2637';

const LABEL_WIDTH = 70;
const LABEL_HEIGHT = 28;

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: '3', type: 'element', data: { label: 'Node 3' }, position: { x: 300, y: 100 } },
  { id: 'link-1', type: 'link', source: { id: '1' }, target: { id: '2' } },
  { id: 'link-2', type: 'link', source: { id: '2' }, target: { id: '3' } },
];

function LinkPath() {
  // Link geometry is paper-scoped (the same link can render on multiple papers
  // with different routing), so it lives on a dedicated hook rather than the
  // LinkRecord. `useLinkLayout()` reads it from the surrounding paper context
  // and re-reads whenever JointJS finishes a render pass.
  const id = useCellId();
  const layout = useLinkLayout();

  if (!layout) return null;

  const midX = (layout.sourceX + layout.targetX) / 2;
  const midY = (layout.sourceY + layout.targetY) / 2;

  return (
    <>
      <path
        d={layout.d}
        stroke={PRIMARY}
        opacity={0.25}
        strokeWidth={18}
        fill="none"
        strokeLinecap="round"
      />
      <foreignObject
        x={midX - LABEL_WIDTH / 2}
        y={midY - LABEL_HEIGHT / 2}
        width={LABEL_WIDTH}
        height={LABEL_HEIGHT}
      >
        <div className="flex size-full items-center justify-center">
          <span className="jj-chip">Link {id}</span>
        </div>
      </foreignObject>
    </>
  );
}

function Main({ isRenderLinkEnabled }: Readonly<{ isRenderLinkEnabled: boolean }>) {
  const renderLink: RenderLink = useCallback(() => <LinkPath />, []);
  return (
    <Paper className="min-h-0 flex-1" renderLink={isRenderLinkEnabled ? renderLink : undefined} />
  );
}

export default function App() {
  const [isRenderLinkEnabled, setIsRenderLinkEnabled] = useState(true);
  const toggle = useCallback(() => setIsRenderLinkEnabled((value) => !value), []);

  return (
    <GraphProvider initialCells={initialCells}>
      <div className="flex size-full flex-col">
        <div className="jj-controls m-3">
          <button type="button" className="jj-btn" onClick={toggle}>
            {isRenderLinkEnabled ? 'Disable' : 'Enable'} renderLink
          </button>
        </div>
        <Main isRenderLinkEnabled={isRenderLinkEnabled} />
      </div>
    </GraphProvider>
  );
}
