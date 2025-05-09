import { useEffect, useRef, useState } from 'react';
import type { PaperOptions } from '../utils/create-paper';
import { createPaper } from '../utils/create-paper';
import { mvc, type dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import type { PaperEventType, PaperEvents } from '../types/event.types';
import { handleEvent } from '../utils/handle-paper-events';

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
export function useCreatePaper(options: UseCreatePaperOptions = {}) {
  const { overwriteDefaultPaperElement, ...restOptions } = options;

  const paperContainerElement = useRef<HTMLDivElement | null>(null);
  const { graph, onRenderPorts } = useGraphStore();

  // If paper is not inside the PaperContext, create a new paper instance.
  const [paper, setPaper] = useState<dia.Paper | null>(null);

  useEffect(() => {
    const jointPaper = createPaper(graph, {
      ...restOptions,
      onRenderPorts,
      // paperElement: paperContainerElement,
      // el: paperContainerElement.current,
    });

    if (overwriteDefaultPaperElement) {
      paperContainerElement.current?.append(overwriteDefaultPaperElement(jointPaper));
    } else {
      paperContainerElement.current?.append(jointPaper.el);
    }

    jointPaper.unfreeze();

    setPaper(jointPaper);

    return () => {
      jointPaper.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, onRenderPorts, overwriteDefaultPaperElement]);

  useEffect(() => {
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
  }, [paper, restOptions]);

  useEffect(() => {
    if (!paper) {
      return;
    }
    if (options?.scale !== undefined) {
      paper.scale(options.scale);
    }
  }, [options?.scale, paper]);

  return {
    paper,
    paperContainerElement,
  };
}
