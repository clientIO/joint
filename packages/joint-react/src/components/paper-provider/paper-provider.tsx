import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { PaperContext, type PaperContextValue } from '../../context';
import { dia } from '@joint/core';
import { useGraph } from '../../hooks';
import { createPortsStore } from '../../data/create-ports-store';
import type { PortElementsCacheEntry } from '../../data/create-ports-data';
import type { OmitWithoutIndexSignature } from '../../types';
const DEFAULT_CLICK_THRESHOLD = 10;

export type OnPaperRenderElement = (element: dia.Element, portalElement: SVGElement) => void;

export type ReactPaperOptions = OmitWithoutIndexSignature<dia.Paper.Options, 'frozen'>;

// Interface for Paper options, extending JointJS Paper options
export interface PaperOptions extends ReactPaperOptions {
  readonly scale?: number;
  /**
   * A function that is called when the paper is ready.
   * @param element - The element that is being rendered
   * @param portalElement  - The portal element that is being rendered
   * @returns
   */
  readonly onRenderElement?: OnPaperRenderElement;
}
/**
 * PaperProvider is a React component that provides a context for managing the state of the paper.
 * It uses the PaperContext to provide a value to its children.
 * The context value is an array containing the current paper context and a function to update it.
 * @param props - The props object containing the children components.
 * @param props.children - The children components that will have access to the PaperContext.
 * @returns - A JSX element that wraps the children with the PaperContext provider.
 * @group Components
 */
export function PaperProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const graph = useGraph();
  const onRenderElementRef = useRef<OnPaperRenderElement | null>(null);

  const [paperCtx] = useState<PaperContextValue>(function (): PaperContextValue {
    const portStore = createPortsStore();
    const elementView = dia.ElementView.extend({
      // Render element using react, `elementView.el` is used as portal gate for react (createPortal)
      onRender() {
        if (onRenderElementRef.current) {
          // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias, no-shadow, @typescript-eslint/no-shadow
          const elementView: dia.ElementView = this;
          onRenderElementRef.current(elementView.model, elementView.el as SVGGElement);
        }
      },
      // Render port using react, `portData.portElement.node` is used as portal gate for react (createPortal)
      _renderPorts() {
        // This is firing when the ports are rendered (updated, inserted, removed)
        // @ts-expect-error we use private jointjs api method, it throw error here.
        dia.ElementView.prototype._renderPorts.call(this);
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias, no-shadow, @typescript-eslint/no-shadow
        const elementView: dia.ElementView = this;

        const portElementsCache: Record<string, PortElementsCacheEntry> = this._portElementsCache;
        portStore.onRenderPorts(elementView.model.id, portElementsCache);
      },
    });
    // Create a new JointJS Paper with the provided options
    const paper = new dia.Paper({
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      preventDefaultBlankAction: false,
      frozen: true,
      model: graph,
      elementView,
    });
    return {
      paper,
      portStore,
    };
  });

  const onSetPaper = useCallback(
    ({ clickThreshold, onRenderElement, ...restOptions }: PaperOptions) => {
      const { paper } = paperCtx;
      onRenderElementRef.current = onRenderElement ?? null;
      paper.options = {
        ...paper.options,
        ...restOptions,
      };
      paper.options.clickThreshold = clickThreshold ?? DEFAULT_CLICK_THRESHOLD;
    },
    [paperCtx]
  );

  const contextValue = useMemo((): PaperContext => [paperCtx, onSetPaper], [onSetPaper, paperCtx]);

  // checking for the existing context exist, if exist, just return the children
  const existingCtx = useContext(PaperContext);
  const hasExistingCtx = !!existingCtx;
  if (hasExistingCtx) {
    return children;
  }
  return <PaperContext.Provider value={contextValue}>{children}</PaperContext.Provider>;
}
