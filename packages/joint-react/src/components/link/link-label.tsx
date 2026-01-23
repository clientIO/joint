import type { dia } from '@joint/core';
import { memo, useId, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGraphStore } from '../../hooks/use-graph-store';
import { useGraphInternalStoreSelector } from '../../hooks/use-graph-store-selector';
import { useCellId, usePaperStoreContext } from '../../hooks';

interface LinkLabelWithId extends dia.Link.Label {
  readonly labelId: string;
}

export interface LinkLabelPosition extends dia.LinkView.LabelOptions {
  /**
   * Distance along the link (0-1 for relative, or absolute pixels with absoluteDistance: true).
   * 0 = start, 0.5 = middle, 1 = end
   */
  readonly distance?: number;
  /**
   * Offset from the link path.
   * Can be a number (perpendicular offset) or an object with x and y (absolute offset).
   */
  readonly offset?: number | { readonly x: number; readonly y: number };
  /**
   * Rotation angle in degrees.
   */
  readonly angle?: number;
  /**
   * Additional position arguments (e.g., absoluteDistance, reverseDistance, absoluteOffset).
   */
  readonly args?: Record<string, unknown>;
}

export interface LinkLabelProps extends LinkLabelPosition {
  /**
   * Children to render inside the label portal.
   */
  readonly children?: React.ReactNode;
  /**
   * Label attributes.
   */
  readonly attrs?: dia.Link.Label['attrs'];
  /**
   * Label size.
   */
  readonly size?: dia.Link.Label['size'];
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: LinkLabelProps) {
  const { children, attrs, size, angle, args, distance, offset, ensureLegibility, keepGradient } =
    props;
  const linkId = useCellId();
  const graphStore = useGraphStore();
  const { graph } = graphStore;
  const paperStore = usePaperStoreContext();
  const { paper, paperId } = paperStore;
  const labelsRef = useRef<readonly dia.Link.Label[]>([]);
  const labelId = useId();

  // Prepare label data during render (synchronous, runs before useLayoutEffect)
  const labelData = useMemo<LinkLabelWithId | null>(() => {
    if (!paper) {
      return null;
    }
    const position: dia.Link.LabelPosition = {
      distance,
      offset,
      angle,
      args: {
        ...args,
        ensureLegibility,
        keepGradient,
      },
    };

    return {
      position,
      attrs,
      size,
      labelId,
    };
  }, [paper, distance, offset, angle, args, ensureLegibility, keepGradient, attrs, size, labelId]);

  // Effect 1: Create label on mount, remove on unmount
  // Only depends on paper and graph (stable references) - runs on mount/unmount
  useLayoutEffect(() => {
    if (!labelData) {
      return;
    }

    const link = graph.getCell(linkId);
    if (!link) {
      throw new Error(`Link with id ${linkId} not found`);
    }
    if (!link.isLink()) {
      throw new Error(`Cell with id ${linkId} is not a link`);
    }

    // Apply pre-computed label data (faster than computing in effect)
    graphStore.setLinkLabel(linkId, labelId, labelData);
    graphStore.flushPendingUpdates();
    labelsRef.current = link.labels();
    return () => {
      // Remove label via graphStore for batching
      graphStore.removeLinkLabel(linkId, labelId);
    };
  }, [graph, graphStore, linkId, labelId, labelData]); // labelData is pre-computed, so effect is faster

  // Effect 2: Update label when props change
  // Uses pre-computed labelData from useMemo (faster than computing in effect)
  useLayoutEffect(() => {
    if (!labelData) {
      return;
    }

    const link = graph.getCell(linkId);
    if (!link) {
      return;
    }
    if (!link.isLink()) {
      return;
    }

    const currentLabels = link.labels();
    const existingLabelIndex = currentLabels.findIndex(
      (label) => (label as LinkLabelWithId).labelId === labelId
    );

    if (existingLabelIndex === -1) {
      return;
    }

    // Apply pre-computed label data (faster than computing in effect)
    graphStore.setLinkLabel(linkId, labelId, labelData);
    labelsRef.current = link.labels();
  }, [graph, graphStore, linkId, labelId, labelData]); // labelData is pre-computed, so effect is faster

  const portalNode = useGraphInternalStoreSelector((state) => {
    // Read labels directly from the link model to ensure we have the latest state
    const link = graph.getCell(linkId);
    if (!link?.isLink()) {
      return null;
    }
    const labels = link.labels();
    const labelIndex = labels.findIndex((l) => (l as LinkLabelWithId).labelId === labelId);
    if (labelIndex === -1) {
      return null;
    }
    const linkLabelId = paperStore.getLinkLabelId(linkId, labelIndex);
    return state.papers[paperId]?.linksData?.[linkLabelId];
  });

  // Component always mounts, useLayoutEffect runs immediately to add label to graph
  // Portal rendering waits until portalNode is available (createPortal requires valid DOM node)
  if (!portalNode) {
    return null;
  }

  return createPortal(children, portalNode);
}

/**
 * LinkLabel component renders content at a specific position along a link.
 * Must be used inside `renderLink` function.
 * @group Components
 * @category Link
 * @example
 * ```tsx
 * function RenderLink({ id }) {
 *   return (
 *     <>
 *       <BaseLink attrs={{ line: { stroke: 'blue' } }} />
 *       <LinkLabel position={{ distance: 0.5 }}>
 *         <text>Label</text>
 *       </LinkLabel>
 *     </>
 *   );
 * }
 * ```
 */
export const LinkLabel = memo(Component);
