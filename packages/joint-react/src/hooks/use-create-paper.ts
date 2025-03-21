import { useCallback, use, useEffect, useRef, useState } from 'react';
import { PaperContext } from '../context/paper-context';
import type { PaperOptions } from '../utils/create-paper';
import { createPaper, PAPER_PORTAL_RENDER_EVENT } from '../utils/create-paper';
import { mvc, type dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import { useGraph } from './use-graph';
import type { PaperEvents, PaperEventType } from 'src/types/event.types';
import { handleEvent } from 'src/utils/handle-paper-events';

interface UseCreatePaperOptions extends PaperOptions, PaperEvents {
  readonly onRenderElement?: (element: dia.Element, portalElement: SVGGElement) => void;
  readonly isTransformToFitContentEnabled?: boolean;
}

/**
 * Custom hook to use a JointJS paper instance.
 * It retrieves the paper from the PaperContext or creates a new instance.
 * Returns a reference to the paper HTML element.
 *
 * @group Hooks
 * @internal
 *
 * @param options - Options for creating the paper instance.
 * @returns An object containing the paper instance and a reference to the paper HTML element.
 */
export function useCreatePaper(options?: UseCreatePaperOptions) {
  const { onRenderElement, isTransformToFitContentEnabled, ...restOptions } = options ?? {};
  const graph = useGraph();
  const hasRenderElement = !!onRenderElement;
  const paperHtmlElement = useRef<HTMLDivElement | null>(null);
  const graphStore = useGraphStore();
  if (!graphStore) {
    throw new Error('usePaper must be used within a GraphProvider');
  }
  // Try to get the paper from the context, it can be undefined if there is no PaperContext.
  const paperCtx = use(PaperContext);
  // If paper is not inside the PaperContext, create a new paper instance.
  const [paperState] = useState<dia.Paper | null>(() => {
    if (paperCtx) {
      return null;
    }
    return createPaper(graphStore.graph, restOptions);
  });
  const isPaperFromContext = paperCtx !== undefined;
  const paper = paperCtx ?? paperState;

  if (!paper) {
    // This throw should never happen, it's just to make TypeScript happy and return a paper instance.
    throw new Error('Paper not found');
  }

  const resizePaperContainer = useCallback(() => {
    if (paperHtmlElement.current) {
      paperHtmlElement.current.style.width = paper.el.style.width;
      paperHtmlElement.current.style.height = paper.el.style.height;
    }
  }, [paper]);

  const listener = useCallback(() => {
    // An object to keep track of the listeners. It's not exposed, so the users
    // can't undesirably remove the listeners.
    const controller = new mvc.Listener();

    // Update the elements state when the graph data changes

    controller.listenTo(paper, 'resize', resizePaperContainer);

    // We need to setup the react state for the element only when renderElement is provided
    if (hasRenderElement) {
      // Update the portal node reference when the element view is rendered
      controller.listenTo(
        paper,
        PAPER_PORTAL_RENDER_EVENT,
        ({ model: cell }: dia.ElementView, nodeSvgGElement: SVGGElement) => {
          onRenderElement(cell, nodeSvgGElement);
        }
      );
    }

    controller.listenTo(paper, 'all', (type: PaperEventType, ...args: unknown[]) =>
      handleEvent(type, restOptions, ...args)
    );

    return () => controller.stopListening();
    // TODO: We need to somehow exclusively add restOptions events manually to dependencies, otherwise it will be not memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRenderElement, onRenderElement, paper, resizePaperContainer]);

  useEffect(() => {
    paperHtmlElement.current?.append(paper.el);
    resizePaperContainer();
    paper.unfreeze();

    const unsubscribe = listener();

    return () => {
      paper.freeze();
      unsubscribe();
    };
  }, [listener, paper, resizePaperContainer]);

  useEffect(() => {
    if (options?.scale !== undefined) {
      paper.scale(options.scale);
    }
  }, [options?.scale, paper]);

  useEffect(() => {
    if (!isTransformToFitContentEnabled) {
      return;
    }

    const graphBBox = graph.getBBox();

    if (graphBBox === null) {
      return;
    }
    paper.transformToFitContent({
      padding: 0,
      contentArea: graphBBox,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  }, [graph, isTransformToFitContentEnabled, paper]);

  return {
    isPaperFromContext,
    paper,
    paperHtmlElement,
  };
}
