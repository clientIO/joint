import type { dia } from '@joint/core';
import React, { forwardRef, memo, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PaperStoreContext } from '../../context';
import { useCreatePortalPaper } from '../../hooks/use-create-portal-paper';
import type { PaperProps } from './paper.types';
import { DEFAULT_PAPER_ID } from '../../mvc/paper';

/**
 * Internal Paper implementation used by forwarded {@link Paper} component.
 * @param props - Paper component props.
 * @param forwardedRef - Ref receiving the created JointJS paper instance.
 * @returns JSX for paper host and portaled paper content.
 */
function PaperBase(
  props: Readonly<PaperProps>,
  forwardedRef: React.ForwardedRef<dia.Paper | null>
) {
  const { className, style, children, paper: externalPaper } = props;
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const id = props.id ?? DEFAULT_PAPER_ID;
  const isExternalPaper = !!externalPaper;
  const { paperRef, paperStore, isReady, content } = useCreatePortalPaper({
    ...props,
    nodeRef: isExternalPaper ? undefined : paperHTMLElementRef,
    id,
    style,
    className,
    isExternalPaper,
  });

  useImperativeHandle<dia.Paper | null, dia.Paper | null>(forwardedRef, () => paperRef.current);

  const paper = paperRef.current;
  const portaledChildren =
    isReady && children && paper?.el ? createPortal(children, paper.el) : null;

  // The host div IS `paper.el`: dia.Paper adds its own classes (`jj-paper`,
  // theme) to it imperatively after mount, so `className` must not go through
  // the JSX attribute — React would rewrite the whole class attribute and wipe
  // the joint classes. Add the prop's tokens via classList instead; the effect
  // cleanup removes them again, so a changed prop swaps only its own tokens.
  useLayoutEffect(() => {
    const element = paperHTMLElementRef.current;
    if (!element || !className) return;
    const tokens = className.split(/\s+/).filter(Boolean);
    element.classList.add(...tokens);
    return () => element.classList.remove(...tokens);
  }, [className]);

  // When paper is externally managed (e.g. by PortalStencil), skip the host div —
  // the paper's DOM is already mounted elsewhere. Only render portal content.
  if (isExternalPaper) {
    return (
      <PaperStoreContext.Provider value={paperStore ?? null}>
        {isReady && content}
        {portaledChildren}
      </PaperStoreContext.Provider>
    );
  }

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      {/* className intentionally NOT passed — see the classList effect above. */}
      <div ref={paperHTMLElementRef} style={style}>
        {isReady && content}
      </div>
      {portaledChildren}
    </PaperStoreContext.Provider>
  );
}

const ForwardedPaper = forwardRef(PaperBase);

/**
 * The interactive diagram canvas.
 *
 * Renders the graph's elements and links, hosts user interactions
 * (selection, drag, link creation, zoom/pan), and lets you customize each
 * cell with your own React components. Mount inside a `<GraphProvider>` and
 * size it with CSS. The canvas fills its parent.
 * @example
 * ```tsx
 * import { GraphProvider, Paper, HTMLBox, type CellRecord } from '@joint/react';
 *
 * interface NodeData {
 *   label: string;
 * }
 *
 * const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
 *   { id: '1', type: 'element', position: { x: 40, y: 40 }, data: { label: 'Hello' } },
 *   { id: '2', type: 'element', position: { x: 280, y: 180 }, data: { label: 'World' } },
 *   { id: 'edge', type: 'link', source: { id: '1' }, target: { id: '2' } },
 * ];
 *
 * function Diagram() {
 *   return (
 *     <GraphProvider initialCells={initialCells}>
 *       <Paper
 *         style={{ width: '100%', height: 600 }}
 *         renderElement={(data: NodeData) => <HTMLBox>{data.label}</HTMLBox>}
 *       />
 *     </GraphProvider>
 *   );
 * }
 * ```
 * @see {@link PaperProps} for the full prop surface.
 * @group Components
 */
export const Paper = memo(ForwardedPaper) as (
  props: PaperProps & { ref?: React.Ref<dia.Paper | null> }
) => React.ReactNode;
