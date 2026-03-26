import { useLayoutEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import typedMemo from '../../../utils/typed-react';
import {
  useGraphStore,
  useElementLayout,
  usePaper,
  useElementId,
  useElementData,
} from '../../../hooks';

/**
 * Props for element item portal components.
 * No `id` or data props — the component reads data via hooks from CellIdContext.
 */
export interface ElementItemProps {
  /** Function that renders the element content. Receives element data from hooks internally. */
  readonly renderElement: (element: unknown) => ReactNode;
  /** The DOM element to portal into. */
  readonly portalElement: SVGElement | HTMLElement | null;
  /** Whether all auto-sized elements have been measured. */
  readonly areElementsMeasured: boolean;
}

/**
 * SVG element portal component.
 * Reads element data via useElementData from CellIdContext — no data props needed.
 * Clears cached views after measurement to force re-render with correct dimensions.
 * @internal
 */
function SVGElementItemComponent(props: ElementItemProps) {
  const { renderElement, portalElement, areElementsMeasured } = props;
  const id = useElementId();
  const data = useElementData();
  const graphStore = useGraphStore();
  const { paper } = usePaper();

  useLayoutEffect(() => {
    if (!areElementsMeasured) {
      return;
    }
    graphStore.clearViewForElementAndLinks({
      cellId: id,
      paper,
    });
  }, [id, graphStore, areElementsMeasured, paper]);

  if (!portalElement) {
    return null;
  }

  // Pass user data (D) to renderElement — only re-renders when data changes
  const element = renderElement(data);
  return createPortal(element, portalElement);
}

/**
 * Helper paper render component wrapped in a portal to render SVGElement.
 * @param props - The props for the component.
 * @group Components
 * @returns The rendered element inside the portal.
 * @internal
 */
export const SVGElementItem = typedMemo(SVGElementItemComponent);

/**
 * HTML element portal component with absolute positioning.
 * Reads layout (position/size) via useElementLayout for CSS positioning.
 * @internal
 */
function HTMLElementItemComponent(props: ElementItemProps) {
  const { renderElement, portalElement, areElementsMeasured } = props;
  const id = useElementId();
  const data = useElementData();
  const graphStore = useGraphStore();
  const { paper } = usePaper();
  const { width, height, x, y } = useElementLayout();

  useLayoutEffect(() => {
    if (!areElementsMeasured) {
      return;
    }
    graphStore.clearViewForElementAndLinks({
      cellId: id,
      paper,
    });
  }, [id, graphStore, areElementsMeasured, paper]);

  const style = useMemo(
    (): CSSProperties => ({
      width,
      height,
      position: 'absolute',
      left: 0,
      top: 0,
      transform: `translate(${x}px, ${y}px)`,
      pointerEvents: 'auto',
    }),
    [height, width, x, y]
  );

  if (!portalElement) {
    return null;
  }

  const element = renderElement(data);
  const container = (
    <div model-id={id} style={style}>
      {element}
    </div>
  );

  return createPortal(container, portalElement);
}

/**
 * Helper paper render component wrapped in a portal to render HTMLElement.
 * @param props - The props for the component.
 * @group Components
 * @returns The rendered element inside the portal.
 * @internal
 */
export const HTMLElementItem = typedMemo(HTMLElementItemComponent);

/**
 * SVG hit area for elements rendered in the HTML overlay layer.
 * Renders a transparent rectangle matching the element's size so that
 * pointer events (click, hover, drag) are captured by the SVG paper.
 * @group Components
 * @internal
 */
export function ElementHitArea() {
  const layout = useElementLayout();
  const { width, height } = layout;
  return <rect width={width} height={height} fill="transparent" />;
}
