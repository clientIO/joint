import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GraphStoreContext, PaperContext } from '../../context';
import { dia } from '@joint/core';
import { useGraph } from '../../hooks';
import { createPortsStore } from '../../data/create-ports-store';
import type { PortElementsCacheEntry } from '../../data/create-ports-data';
import type { OmitWithoutIndexSignature } from '../../types';
import { GraphProvider, type GraphProps } from '../graph-provider/graph-provider';
import { useElementViews, type OnPaperRenderElement } from '../../hooks/use-element-views';
import { PaperProviderConfigContext } from '../../context/paper-provide-config-context';
const DEFAULT_CLICK_THRESHOLD = 10;

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

export interface PaperProviderProps extends Omit<ReactPaperOptions, 'className'>, GraphProps {
  readonly children: React.ReactNode;
}
const EMPTY_OBJECT = {} as Record<dia.Cell.ID, dia.ElementView>;

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: Readonly<PaperProviderProps>) {
  const { children, ...paperOptions } = props;
  const graph = useGraph();
  const { overwriteDefaultPaperElement } = useContext(PaperProviderConfigContext) ?? {};
  const { onRenderElement, elementViews } = useElementViews();
  const paperHTMLElement = useRef<HTMLDivElement | null>(null);

  const [paperCtx] = useState<PaperContext>(function (): PaperContext {
    const portsStore = createPortsStore();
    const elementView = dia.ElementView.extend({
      // Render element using react, `elementView.el` is used as portal gate for react (createPortal)
      onRender() {
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias, no-shadow, @typescript-eslint/no-shadow
        const elementView: dia.ElementView = this;
        onRenderElement(elementView);
      },
      // Render port using react, `portData.portElement.node` is used as portal gate for react (createPortal)
      _renderPorts() {
        // This is firing when the ports are rendered (updated, inserted, removed)
        // @ts-expect-error we use private jointjs api method, it throw error here.
        dia.ElementView.prototype._renderPorts.call(this);
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias, no-shadow, @typescript-eslint/no-shadow
        const elementView: dia.ElementView = this;

        const portElementsCache: Record<string, PortElementsCacheEntry> = this._portElementsCache;
        portsStore.onRenderPorts(elementView.model.id, portElementsCache);
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
      ...paperOptions,
      clickThreshold: paperOptions.clickThreshold ?? DEFAULT_CLICK_THRESHOLD,
    });

    /**
     * Render paper ulitily - is called when html element is bind to the react paper component
     * @param element - The HTML element to render the paper into
     */
    function renderPaper(element: HTMLElement) {
      if (!paper) {
        throw new Error('Paper is not created');
      }

      const elementToRender = overwriteDefaultPaperElement
        ? overwriteDefaultPaperElement(paperCtx)
        : paper.el;

      if (!elementToRender) {
        throw new Error('overwriteDefaultPaperElement must return a valid HTML or SVG element');
      }

      element.replaceChildren(elementToRender);
      paper.unfreeze();
    }

    return {
      paper,
      portsStore,
      elementViews: EMPTY_OBJECT,
      paperHTMLElement,
      renderPaper,
    };
  });

  useEffect(() => {
    paperCtx.paper.options = {
      ...paperCtx.paper.options,
      ...paperOptions,
    };
  }, [paperCtx.paper, paperOptions]);

  const paperContextFull = useMemo((): PaperContext => {
    return {
      ...paperCtx,
      elementViews,
    };
  }, [paperCtx, elementViews]);

  // Remove the check for existing context, always provide PaperContext
  return <PaperContext.Provider value={paperContextFull}>{children}</PaperContext.Provider>;
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
export function PaperProvider(props: Readonly<PaperProviderProps>) {
  const {
    children,
    initialElements: initialElements,
    initialLinks: initialLinks,
    graph,
    cellNamespace,
    cellModel,
    store,
    ...paperOptions
  } = props;
  const hasStore = !!useContext(GraphStoreContext);
  const content = <Component {...paperOptions}>{children}</Component>;
  if (hasStore) {
    return content;
  }
  return (
    <GraphProvider
      initialElements={initialElements}
      initialLinks={initialLinks}
      graph={graph}
      cellNamespace={cellNamespace}
      cellModel={cellModel}
      store={store}
    >
      {content}
    </GraphProvider>
  );
}
