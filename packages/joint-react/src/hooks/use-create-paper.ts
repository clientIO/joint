import { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { PaperContext } from '../context/paper-context';
import type { PaperOptions } from '../utils/create-paper';
import { createPaper } from '../utils/create-paper';
import { mvc, type dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import type { PaperEventType, PaperEvents } from '../types/event.types';
import { handleEvent } from '../utils/handle-paper-events';
import type { OnLoadOptions } from '../components';

interface UseCreatePaperOptions extends PaperOptions, PaperEvents {
  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param paper - The paper instance
   * @returns
   */
  readonly overwriteDefaultPaperElement?: (paper: dia.Paper) => HTMLElement | SVGElement;
  /**
   * A function that is called when the paper is ready and all elements are rendered.
   */
  readonly onLoad?: (options: OnLoadOptions) => void;
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
  const { overwriteDefaultPaperElement, onLoad, ...restOptions } = options ?? {};

  const paperHtmlElement = useRef<HTMLDivElement | null>(null);
  const { graph, isLoaded, onRenderPorts } = useGraphStore();

  // Try to get the paper from the context, it can be undefined if there is no PaperContext.
  const paperCtx = useContext(PaperContext);
  // If paper is not inside the PaperContext, create a new paper instance.
  const [paperState] = useState<dia.Paper | null>(() => {
    if (paperCtx) {
      return null;
    }
    return createPaper(graph, { ...restOptions, onRenderPorts });
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
      handleEvent(type, restOptions, paper, ...args)
    );

    return () => controller.stopListening();
    // TODO: We need to find out some mechanism to add events to the paper, now i think memoized events will not works properly.
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

    if (onLoad) {
      onLoad({ graph, paper });
    }
  }, [graph, isLoaded, onLoad, paper]);

  return {
    isPaperFromContext,
    paper,
    paperHtmlElement,
    isLoaded,
  };
}
