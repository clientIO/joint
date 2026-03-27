import type { dia } from '@joint/core';
import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PaperStoreContext } from '../../context';
import { useCreatePortalPaper } from '../../hooks/use-create-portal-paper';
import type { PaperProps } from './paper.types';

/**
 * Resolves a CSS dimension value to a JointJS Paper dimension.
 * @param dimension - The CSS width or height value.
 * @returns The resolved dimension or undefined.
 */
function resolveStyleDimension(
  dimension: React.CSSProperties['width'] | React.CSSProperties['height']
): dia.Paper.Dimension | undefined {
  if (dimension === undefined) {
    return undefined;
  }
  return dimension;
}

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
  const { className, style, children, width, height, paper: externalPaper } = props;
  const resolvedWidth = width ?? resolveStyleDimension(style?.width);
  const resolvedHeight = height ?? resolveStyleDimension(style?.height);
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const id = props.id ?? `paper-${reactId}`;
  const isExternalPaper = !!externalPaper;
  const { paperRef, paperStore, isReady, content } = useCreatePortalPaper({
    ...props,
    width: resolvedWidth,
    height: resolvedHeight,
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

export const Paper = forwardRef(PaperBase);
