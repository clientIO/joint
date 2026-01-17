import { memo, useLayoutEffect, useMemo } from 'react';
import { useGraphStore } from '../../hooks/use-graph-store';
import { useCellId, usePaperStoreContext } from '../../hooks';
import type { StandardLinkShapesTypeMapper } from '../../types/link-types';
import { getLinkArrow, type LinkArrowName, type MarkerProps } from './link.arrows';
import { jsx } from '../../utils/joint-jsx/jsx-to-markup';
import type React from 'react';
import type { OmitWithoutIndexSignature } from '../../types';

type StandardLinkAttributes = Required<StandardLinkShapesTypeMapper['standard.Link']>;
type LineAttributes = StandardLinkAttributes['line'];

/**
 * Marker configuration - either a predefined arrow name or a direct component function.
 */
export type MarkerConfig = LinkArrowName | ((props: MarkerProps) => React.JSX.Element);

export interface BaseLinkProps
  extends OmitWithoutIndexSignature<LineAttributes, 'sourceMarker' | 'targetMarker'> {
  /**
   * Arrow marker for the start of the link.
   * Can be a predefined arrow name from LINK_ARROWS or a direct component function.
   */
  readonly startMarker?: MarkerConfig;
  /**
   * Arrow marker for the end of the link.
   * Can be a predefined arrow name from LINK_ARROWS or a direct component function.
   */
  readonly endMarker?: MarkerConfig;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: BaseLinkProps) {
  const { startMarker, endMarker, ...lineAttributes } = props;
  const linkId = useCellId();
  const graphStore = useGraphStore();
  const { graph } = graphStore;
  const { paper } = usePaperStoreContext();

  const resolvedLineAttributes = useMemo(() => {
    const resolved: typeof lineAttributes & {
      sourceMarker?: { markup: ReturnType<typeof jsx> };
      targetMarker?: { markup: ReturnType<typeof jsx> };
    } = { ...lineAttributes };

    // Get the link to check for color attribute
    const link = graph.getCell(linkId);
    const linkColor = link?.attr('color') as string | undefined;

    // Determine marker color: use stroke if provided, otherwise inherit from link color, fallback to black
    const markerColor = (lineAttributes.stroke as string | undefined) ?? linkColor ?? '#000000';

    if (startMarker) {
      let markerComponent: ((props: MarkerProps) => React.JSX.Element) | undefined;

      // Check if it's a predefined marker name or direct function
      if (typeof startMarker === 'string') {
        const marker = getLinkArrow(startMarker);
        markerComponent = marker?.component;
      } else {
        markerComponent = startMarker;
      }

      if (markerComponent) {
        // Convert React component to JointJS markup
        const componentResult = markerComponent({ color: markerColor });
        resolved.sourceMarker = { markup: jsx(componentResult) };
      }
    }

    if (endMarker) {
      let markerComponent: ((props: MarkerProps) => React.JSX.Element) | undefined;

      // Check if it's a predefined marker name or direct function
      if (typeof endMarker === 'string') {
        const marker = getLinkArrow(endMarker);
        markerComponent = marker?.component;
      } else {
        markerComponent = endMarker;
      }

      if (markerComponent) {
        // Convert React component to JointJS markup
        const componentResult = markerComponent({ color: markerColor });
        resolved.targetMarker = { markup: jsx(componentResult) };
      }
    }

    return resolved;
  }, [graph, linkId, lineAttributes, startMarker, endMarker]);

  // Effect 1: Capture default attributes on mount, restore on unmount
  // Only depends on paper and graph (stable references) - runs on mount/unmount
  useLayoutEffect(() => {
    const link = graph.getCell(linkId);

    if (!link) {
      throw new Error(`Link with id ${linkId} not found`);
    }
    if (!paper) {
      return;
    }
    if (!link.isLink()) {
      throw new Error(`Cell with id ${linkId} is not a link`);
    }

    // Capture default attributes for cleanup
    const defaultAttributes = link.attr();

    return () => {
      // Restore default attributes via graphStore for batching
      graphStore.setLink(linkId, defaultAttributes);
    };
  }, [graph, graphStore, paper, linkId]); // Only stable dependencies - captures defaults on mount, restores on unmount

  // Effect 2: Update attributes when props change or when link is updated
  useLayoutEffect(() => {
    const link = graph.getCell(linkId);

    if (!link) {
      return;
    }
    if (!paper) {
      return;
    }
    if (!link.isLink()) {
      return;
    }

    // Always re-apply current attributes via graphStore for batching
    graphStore.setLink(linkId, {
      line: resolvedLineAttributes,
    });
    graphStore.flushPendingUpdates();
  }, [graph, graphStore, resolvedLineAttributes, linkId, paper]);

  return null;
}

/**
 * BaseLink component sets link properties when rendering custom links.
 * Must be used inside `renderLink` function.
 * @group Components
 * @category Link
 * @example
 * ```tsx
 * function RenderLink({ id }) {
 *   return (
 *     <>
 *       <BaseLink stroke="blue" startMarker="arrow" endMarker="arrow" />
 *     </>
 *   );
 * }
 * ```
 * @example
 * ```tsx
 * function RenderLink({ id }) {
 *   return (
 *     <>
 *       <BaseLink
 *         stroke="blue"
 *         startMarker={(props) => <path d="M 0 0 L 10 -5 L 10 5 z" fill={props.color} />}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export const BaseLink = memo(Component);
