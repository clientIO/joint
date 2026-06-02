import type { dia } from '@joint/core';
import { forwardRef, useImperativeHandle, useMemo, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { PaperStoreContext } from '../../context';
import { useCreatePortalPaper } from '../../hooks/use-create-portal-paper';
import { useServerPaperTree } from '../../hooks/use-server-paper-tree';
import type { PaperProps } from './paper.types';
import { DEFAULT_PAPER_ID } from '../../models/react-paper';

/**
 * Internal Paper implementation used by forwarded `Paper` component.
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
  // On the server (when `@joint/react/server` is loaded) build the full diagram
  // as a React tree from the GraphProvider graph — so a plain
  // `<GraphProvider><Paper renderElement={…} /></GraphProvider>` renders a
  // complete diagram. `undefined` on the client (the live paper mounts there).
  const serverTree = useServerPaperTree({ paperId: id, isExternalPaper, props });
  // The server SVG is `position: absolute; inset: 0`, so the host needs
  // `position: relative` to contain it — without JS the live paper isn't there
  // to set it. (The live paper sets it itself on the client.)
  const hostStyle = useMemo<CSSProperties | undefined>(
    () => (serverTree == null ? style : { ...style, position: 'relative' }),
    [serverTree, style]
  );
  const { paperRef, paperStore, isReady, content } = useCreatePortalPaper({
    ...props,
    elementRef: isExternalPaper ? undefined : paperHTMLElementRef,
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
        {isReady ? content : null}
        {portaledChildren}
      </PaperStoreContext.Provider>
    );
  }

  // On the server the host renders the diagram tree (so `renderToString` emits
  // the full SVG). On the client `serverTree` is `undefined`, so React reconciles
  // it away and `useCreatePortalPaper` mounts the live paper into the host;
  // portal content renders there.
  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div className={className} ref={paperHTMLElementRef} style={hostStyle}>
        {serverTree ?? (isReady ? content : null)}
      </div>
      {portaledChildren}
    </PaperStoreContext.Provider>
  );
}

export const Paper = forwardRef(PaperBase);
