import { useContext, useLayoutEffect, useRef } from 'react';
import { mvc, type dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import type { PaperEventType, PaperEvents } from '../types/event.types';
import { handleEvent } from '../utils/handle-paper-events';
import { PaperContext } from '../context';

interface UseCreatePaperOptions extends PaperEvents {
  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param paperCtx - The paper context
   * @returns
   */
  readonly overwriteDefaultPaperElement?: (paperCtx: PaperContext) => HTMLElement | SVGElement;

  readonly scale?: number;
}

/**
 * Custom hook to use a JointJS paper instance.
 * It retrieves the paper from the PaperContext or creates a new instance.
 * Returns a reference to the paper HTML element.
 * This hook must be already be defined inside `PaperProvider`
 * @group Hooks
 * @internal
 * @param options - Options for creating the paper instance.
 * @returns An object containing the paper instance and a reference to the paper HTML element.
 */
export function useCreatePaper(options: UseCreatePaperOptions = {}) {
  const { overwriteDefaultPaperElement, ...restOptions } = options;

  const paperContainerElement = useRef<HTMLDivElement | null>(null);
  const { graph } = useGraphStore();

  const paperCtx = useContext(PaperContext);
  useLayoutEffect(() => {
    if (!paperCtx) {
      return;
    }

    const { paper } = paperCtx;
    if (!paper) {
      throw new Error('Paper is not created');
    }
    if (overwriteDefaultPaperElement) {
      paperContainerElement.current?.append(overwriteDefaultPaperElement(paperCtx));
    } else {
      paperContainerElement.current?.append(paper.el);
    }
    paper.unfreeze();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, overwriteDefaultPaperElement]);

  useLayoutEffect(() => {
    if (!paperCtx) {
      return;
    }
    const { paper } = paperCtx;
    if (!paper) {
      return;
    }
    /**
     * Resize the paper container element to match the paper size.
     * @param jointPaper - The paper instance.
     */
    function resizePaperContainer(jointPaper: dia.Paper) {
      if (paperContainerElement.current) {
        paperContainerElement.current.style.width = jointPaper.el.style.width;
        paperContainerElement.current.style.height = jointPaper.el.style.height;
      }
    }
    // An object to keep track of the listeners. It's not exposed, so the users
    const controller = new mvc.Listener();
    controller.listenTo(paper, 'resize', resizePaperContainer);
    controller.listenTo(paper, 'all', (type: PaperEventType, ...args: unknown[]) =>
      handleEvent(type, restOptions, paper, ...args)
    );
    return () => {
      controller.stopListening();
    };
  }, [paperCtx, restOptions]);

  useLayoutEffect(() => {
    if (!paperCtx) {
      return;
    }
    const { paper } = paperCtx;
    if (!paper) {
      return;
    }
    if (options?.scale !== undefined) {
      paper.scale(options.scale);
    }
  }, [options.scale, paperCtx]);
  return {
    paperCtx,
    paperContainerElement,
  };
}
