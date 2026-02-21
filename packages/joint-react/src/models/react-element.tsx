import { dia } from '@joint/core';
export const REACT_TYPE = 'ReactElement';

/**
 * A custom JointJS element that can render React components.
 * @group Models
 * @example
 * ```ts
 * import { ReactElement } from '@joint/react';
 *
 * const element = new ReactElement({
 *   id: '1',
 *   position: { x: 10, y: 20 },
 *   size: { width: 100, height: 50 },
 * });
 * ```
 */
export class ReactElement<Attributes = dia.Element.Attributes> extends dia.Element<
  dia.Element.Attributes & Attributes
> {
  /**
   * Empty markup - React will render content via portal into view.el
   */
  markup: dia.MarkupJSON = [];

  /**
   * Sets the default attributes for the ReactElement.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: REACT_TYPE,
      portDefaults: {
        groups: {
          main: {
            position: { name: 'absolute' },
          },
        },
      },
    } as unknown as dia.Element.Attributes & Attributes;
  }
}
