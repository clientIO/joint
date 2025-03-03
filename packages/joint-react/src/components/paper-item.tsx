import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import typedMemo from '../utils/typed-memo';
import type { BaseElement, RequiredCell } from '../types/cell.types';

export interface PaperPortalProps<Data extends RequiredCell = BaseElement> {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  readonly renderElement: (element: Data) => ReactNode;
  /**
   * The cell to render.
   */
  readonly nodeSvgGElement: SVGGElement;
}

/**
 * Helper paper render component wrapped in a portal.
 * This component is used to render a paper element inside a portal.
 * It takes a renderElement function, a cell, and a containerElement as props.
 * The renderElement function is called with the cell as an argument and its return value is rendered inside the containerElement.
 * @group Components
 * @internal
 * It's internal component.
 *
 */
function Component<Data extends RequiredCell = BaseElement>(props: PaperPortalProps<Data>) {
  const { renderElement, nodeSvgGElement, ...rest } = props;
  const cell = rest as unknown as Data;
  const element = renderElement(cell);
  return createPortal(element, nodeSvgGElement);
}

export const PaperItem = typedMemo(Component);
