import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { CellWithId } from '../../types/cell.types';
import type { GraphElement } from '../../types/element-types';
import typedMemo from '../../utils/typed-memo';

export interface PaperPortalProps<Data extends CellWithId = GraphElement> {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  readonly renderElement: (element: Data) => ReactNode;
  /**
   * The cell to render.
   */
  readonly nodeSvgGElement: SVGElement;
}

/**
 * Helper paper render component wrapped in a portal.
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
function Component<Data extends CellWithId = GraphElement>(props: PaperPortalProps<Data>) {
  const { renderElement, nodeSvgGElement, ...rest } = props;
  const cell = rest as Data;
  const element = renderElement(cell);

  return createPortal(element, nodeSvgGElement);
}

export const PaperItem = typedMemo(Component);
