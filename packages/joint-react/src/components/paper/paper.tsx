import type { dia } from '@joint/core';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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
      <div className={className} ref={paperHTMLElementRef} style={style}>
        {isReady && content}
      </div>
      {portaledChildren}
    </PaperStoreContext.Provider>
  );
}

/**
 * The interactive diagram canvas.
 *
 * Renders the graph's elements and links, hosts user interactions
 * (selection, drag, link creation, zoom/pan), and lets you customize each
 * cell with your own React components. Mount inside a `<GraphProvider>` and
 * size it with CSS. The canvas fills its parent.
 * @see {@link PaperProps} for the full prop surface.
 * @group Components
 */
export const Paper = forwardRef(PaperBase) as (
  props: PaperProps & { ref?: React.Ref<dia.Paper | null> }
) => React.ReactNode;
