import { useLayoutEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import typedMemo from '../../../utils/typed-react';
import type { FlatElementData } from '../../../types/element-types';
import { useGraphStore, useNodeLayout, usePaper } from '../../../hooks';

export interface ElementItemProps<Data = FlatElementData> {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  readonly renderElement: (element: Data) => ReactNode;
  /**
   * The cell to render.
   */
  readonly portalElement: SVGElement | HTMLElement | null;

  readonly areElementsMeasured: boolean;
  readonly id: string;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function SVGElementItemComponent<Data = FlatElementData>(props: ElementItemProps<Data>) {
  const { renderElement, portalElement, areElementsMeasured, id, ...rest } = props;
  const cell = rest as Data;
  const graphStore = useGraphStore();
  const paper = usePaper();

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

  const element = renderElement(cell);
  return createPortal(element, portalElement);
}

/**
 * Helper paper render component wrapped in a portal to render SVGElement.
 * This component is used to render a paper element inside a portal.
 * It takes a renderElement function, a cell, and a containerElement as props.
 * The renderElement function is called with the cell as an argument and its return value is rendered inside the containerElement.
 * @param props - The props for the component.
 * @group Components
 * @description
 * This component is used to render a paper element inside a portal.
 * @returns The rendered element inside the portal.
 * @internal
 */
export const SVGElementItem = typedMemo(SVGElementItemComponent);

/**
 * Helper paper render component wrapped in a portal to render HTMLElement.
 * This component is used to render a paper element inside a portal.
 * It takes a renderElement function, a cell, and a containerElement as props.
 * The renderElement function is called with the cell as an argument and its return value is rendered inside the containerElement.
 * @param props - The props for the component.
 * @group Components
 * @description
 * This component is used to render a paper element inside a portal.
 * @returns The rendered element inside the portal.
 * @internal
 */
function HTMLElementItemComponent<Data = FlatElementData>(props: ElementItemProps<Data>) {
  const { renderElement, portalElement, areElementsMeasured, id, ...rest } = props;
  const cell = rest as Data;
  // we must use renderElement and not cell data, because user can select different data, so then, the width and height do not have to be inside the cell data.
  const element = renderElement(cell);
  const { width, height, x, y } = cell as FlatElementData;
  const graphStore = useGraphStore();
  const paper = usePaper();

  useLayoutEffect(() => {
    if (!areElementsMeasured) {
      return;
    }
    // HERE TO TRIGGER:
    graphStore.clearViewForElementAndLinks({
      cellId: id,
      paper,
    });
  }, [id, graphStore, areElementsMeasured, paper]);

  // WE NEED TO COMPARE WHAT IS CHANGED HERE...

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

  const container = (
    <div model-id={id} style={style}>
      {element}
    </div>
  );

  return createPortal(container, portalElement);
}

/**
 * Helper paper render component wrapped in a portal to render HTMLElement.
 * This component is used to render a paper element inside a portal.
 * It takes a renderElement function, a cell, and a containerElement as props.
 * @private
 * @param props - The props for the component.
 * @group Components
 * @description
 * This component is used to render a paper element inside a portal.
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
  const layout = useNodeLayout();
  const { width, height } = layout;
  return <rect width={width} height={height} fill="transparent" />;
}
