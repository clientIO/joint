/* eslint-disable @typescript-eslint/no-namespace */

export * from './base-link.types';
export * from './link-label.types';
import { BaseLink } from './base-link';
import { LinkLabel } from './link-label';
export type { BaseLinkProps, MarkerConfig } from './base-link';
export type { LinkLabelProps, LinkLabelPosition } from './link-label.types';
export { LINK_ARROWS, getLinkArrow, type LinkArrowName, type LinkArrowMarker, type MarkerProps } from './link.arrows';

// Direct exports for convenience

const Component = {
  Base: BaseLink,
  Label: LinkLabel,
};

/**
 * Joint js Links in react.
 * Links are used to connect elements together.
 * BaseLink is used to set link properties, and LinkLabel is used to render labels at specific positions along links.
 * @group Components
 * @experimental This feature is experimental and may change in the future.
 * @example
 * ```tsx
 * import { Link } from '@joint/react';
 *
 * function RenderLink({ id }) {
 *  return (
 *    <>
 *      <Link.BaseLink attrs={{ line: { stroke: 'blue' } }} />
 *      <Link.Label position={{ distance: 0.5 }}>
 *        <text>Label</text>
 *      </Link.Label>
 *    </>
 *  );
 * }
 * ```
 */
export namespace Link {
  /**
   * BaseLink component sets link properties when rendering custom links.
   * Must be used inside `renderLink` function.
   * @experimental This feature is experimental and may change in the future.
   * @group Components
   * @category Link
   */
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-shadow
  export const { Base } = Component;
  /**
   * LinkLabel component renders content at a specific position along a link.
   * Must be used inside `renderLink` function.
   * @experimental This feature is experimental and may change in the future.
   * @group Components
   * @category Link
   */
  export const { Label } = Component;
}

export { BaseLink } from './base-link';
export { LinkLabel } from './link-label';
