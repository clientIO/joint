import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { CellWithId } from '../../types/cell.types';
import type { GraphElement } from '../../types/element-types';
import typedMemo from '../../utils/typed-memo';
import { useElement } from '../../hooks';

export interface PaperPortalProps<Data extends CellWithId = GraphElement> {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  readonly renderElement: (element: Data) => ReactNode;
  /**
   * The cell to render.
   */
  readonly rendererElement: SVGElement | HTMLElement | null;
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
function SvgRendererComponent<Data extends CellWithId = GraphElement>(
  props: PaperPortalProps<Data>
) {
  const { renderElement, rendererElement, ...rest } = props;
  if (!rendererElement) {
    return null;
  }
  const cell = rest as Data;
  const element = renderElement(cell);

  return createPortal(element, rendererElement);
}

export const SvgRenderer = typedMemo(SvgRendererComponent);

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
function HTMLRendererComponent<Data extends CellWithId = GraphElement>(
  props: PaperPortalProps<Data>
) {
  const { renderElement, rendererElement, ...rest } = props;
  const cell = rest as Data;
  // we must use renderElement and not cell data, because user can select different data, so then, the width and height do not have to be inside the cell data.
  const element = renderElement(cell);
  const { width, height, x, y, id } = useElement();

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
  if (!rendererElement) {
    return null;
  }

  const container = (
    <div model-id={id} style={style}>
      {element}
    </div>
  );
  return createPortal(container, rendererElement);
}

export const HTMLRenderer = typedMemo(HTMLRendererComponent);
