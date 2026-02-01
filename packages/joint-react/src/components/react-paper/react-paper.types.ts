import type { dia } from '@joint/core';
import type { ReactNode, CSSProperties } from 'react';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';

/**
 * Function type for rendering graph elements.
 * Same API as Paper's RenderElement.
 * @param element - Element data from GraphProvider.
 * @returns React node to render for the element.
 * @group ReactPaper
 */
export type RenderElement<ElementItem extends GraphElement = GraphElement> = (
  element: ElementItem
) => ReactNode;

/**
 * Function type for rendering graph links.
 * Same API as Paper's RenderLink.
 * Inside renderLink, use useLinkLayout() to get computed path data.
 * @param link - Link data from GraphProvider.
 * @returns React node to render for the link.
 * @group ReactPaper
 */
export type RenderLink<LinkItem extends GraphLink = GraphLink> = (link: LinkItem) => ReactNode;

/**
 * Props for the ReactPaper component.
 * @group ReactPaper
 */
export interface ReactPaperProps<ElementItem extends GraphElement = GraphElement> {
  /**
   * Function to render each graph element.
   * Same API as Paper's renderElement.
   */
  readonly renderElement: RenderElement<ElementItem>;
  /**
   * Optional function to render each graph link.
   * Same API as Paper's renderLink.
   * Inside renderLink, use useLinkLayout() to get computed path data (sourceX, sourceY, targetX, targetY, d, vertices).
   */
  readonly renderLink?: RenderLink<GraphLink>;
  /** Unique identifier for this paper instance. Auto-generated if not provided. */
  readonly id?: string;
  /** Width of the paper (number in pixels or CSS string). */
  readonly width?: number | string;
  /** Height of the paper (number in pixels or CSS string). */
  readonly height?: number | string;
  /** CSS class name for the paper container. */
  readonly className?: string;
  /** Inline styles for the paper container. */
  readonly style?: CSSProperties;
  /** Grid size for snapping (in pixels). */
  readonly gridSize?: number;
  /** Whether the paper is interactive or interactive options. */
  readonly interactive?: boolean | dia.Paper.Options['interactive'];
  /** Children elements to render inside the paper. */
  readonly children?: ReactNode;
}
