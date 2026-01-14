import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { CellWithId } from '../../../types/cell.types';
import typedMemo from '../../../utils/typed-react';
import type { GraphElement } from '../../../types/element-types';

export interface ElementItemProps<Data extends CellWithId = GraphElement> {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  readonly renderElement: (element: Data) => ReactNode;
  /**
   * The cell to render.
   */
  readonly portalElement: SVGElement | HTMLElement | null;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function SVGElementItemComponent<Data extends GraphElement = GraphElement>(
  props: ElementItemProps<Data>
) {
  const { renderElement, portalElement, ...rest } = props;
  const cell = rest as Data;

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
function HTMLElementItemComponent<Data extends GraphElement = GraphElement>(
  props: ElementItemProps<Data>
) {
  const { renderElement, portalElement, ...rest } = props;
  const cell = rest as Data;
  // we must use renderElement and not cell data, because user can select different data, so then, the width and height do not have to be inside the cell data.
  const element = renderElement(cell);
  const { width, height, x, y, id } = cell;

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
