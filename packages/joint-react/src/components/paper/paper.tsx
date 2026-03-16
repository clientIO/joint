/* eslint-disable sonarjs/no-dead-store */
/* eslint-disable sonarjs/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { dia } from '@joint/core';
import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { PaperStoreContext } from '../../context';
import { useCreateReactPaper } from '../../hooks/use-create-react-paper';
import type { FlatElementData } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';
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
  return dimension as dia.Paper.Dimension;
}

/**
 * Internal Paper implementation used by forwarded `Paper` component.
 * @param props - Paper component props.
 * @param forwardedRef - Ref receiving the created JointJS paper instance.
 * @returns JSX for paper host and portaled paper content.
 */
function PaperBase<
  ElementData extends FlatElementData = FlatElementData,
  LinkData extends FlatLinkData = FlatLinkData,
>(
  props: Readonly<PaperProps<ElementData, LinkData>>,
  forwardedRef: React.ForwardedRef<dia.Paper | null>
) {
  const { className, style, children, width, height } = props;
  const resolvedWidth = width ?? resolveStyleDimension(style?.width);
  const resolvedHeight = height ?? resolveStyleDimension(style?.height);
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const id = props.id ?? `paper-${reactId}`;
  const { paperRef, paperStore, isReady, content } = useCreateReactPaper({
    ...props,
    width: resolvedWidth,
    height: resolvedHeight,
    elementRef: paperHTMLElementRef,
    id,
    style,
    className,
  });

  useImperativeHandle<dia.Paper | null, dia.Paper | null>(forwardedRef, () => paperRef.current);
  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div className={className} ref={paperHTMLElementRef} style={style}>
        {isReady && content}
      </div>
      {isReady && children}
    </PaperStoreContext.Provider>
  );
}

export const Paper = forwardRef(PaperBase) as <
  ElementData extends FlatElementData = FlatElementData,
  LinkData extends FlatLinkData = FlatLinkData,
>(
  props: Readonly<PaperProps<ElementData, LinkData>> & {
    ref?: React.Ref<dia.Paper | null>;
  }
) => ReturnType<typeof PaperBase>;
