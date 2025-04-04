import { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { PaperContext } from '../context/paper-context';
import type { PaperOptions } from '../utils/create-paper';
import { createPaper } from '../utils/create-paper';
import { mvc, type dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import type { PaperEvents, PaperEventType } from '../types/event.types';
import { handleEvent } from '../utils/handle-paper-events';

interface UseCreatePaperOptions extends PaperOptions, PaperEvents {
  readonly isTransformToFitContentEnabled?: boolean;
  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param paper - The paper instance
   * @returns
   */
  readonly overwriteDefaultPaperElement?: (paper: dia.Paper) => HTMLElement | SVGElement;
}

/**
 * Custom hook to use a JointJS paper instance.
 * It retrieves the paper from the PaperContext or creates a new instance.
 * Returns a reference to the paper HTML element.
 * @group Hooks
 * @internal
 * @param options - Options for creating the paper instance.
 * @returns An object containing the paper instance and a reference to the paper HTML element.
 */
export function useCreatePaper(options?: UseCreatePaperOptions) {
  const { overwriteDefaultPaperElement, isTransformToFitContentEnabled, ...restOptions } =
    options ?? {};

  const paperHtmlElement = useRef<HTMLDivElement | null>(null);
  const { graph, isLoaded, onRenderPort } = useGraphStore();

  // Try to get the paper from the context, it can be undefined if there is no PaperContext.
  const paperCtx = useContext(PaperContext);
  // If paper is not inside the PaperContext, create a new paper instance.
  const [paperState] = useState<dia.Paper | null>(() => {
    if (paperCtx) {
      return null;
    }
    return createPaper(graph, { ...restOptions, onRenderPort });
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
    const controller = new mvc.Listener();
    controller.listenTo(paper, 'resize', resizePaperContainer);
    controller.listenTo(paper, 'all', (type: PaperEventType, ...args: unknown[]) =>
      handleEvent(type, restOptions, ...args)
    );

    return () => controller.stopListening();
    // TODO: We need to somehow exclusively add restOptions events manually to dependencies, otherwise it will be not memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper, resizePaperContainer]);

  useEffect(() => {
    if (overwriteDefaultPaperElement) {
      paperHtmlElement.current?.append(overwriteDefaultPaperElement(paper));
    } else {
      paperHtmlElement.current?.append(paper.el);
    }

    resizePaperContainer();
    paper.unfreeze();

    const unsubscribe = listener();

    return () => {
      paper.freeze();
      unsubscribe();
    };
  }, [listener, overwriteDefaultPaperElement, paper, resizePaperContainer]);

  useEffect(() => {
    if (options?.scale !== undefined) {
      paper.scale(options.scale);
    }
  }, [options?.scale, paper]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    paper.update();
    if (!isTransformToFitContentEnabled) {
      return;
    }

    const graphBBox = graph.getBBox();

    if (graphBBox === null) {
      return;
    }
    paper.transformToFitContent({
      padding: 40,
      contentArea: graphBBox,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  }, [graph, isTransformToFitContentEnabled, paper, isLoaded]);

  return {
    isPaperFromContext,
    paper,
    paperHtmlElement,
    isLoaded,
  };
}
