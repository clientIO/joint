import type { dia } from '@joint/core';
import { forwardRef, useImperativeHandle, useMemo, useRef, type CSSProperties } from 'react';
import { PaperStoreContext } from '../../context';
import { useCreateReactPaper } from '../../hooks/use-create-react-paper';
import type { FlatElementData } from '../../types/element-types';
import type { PaperProps } from './paper.types';

/**
 * Internal Paper implementation used by forwarded `Paper` component.
 * @param props - Paper component props.
 * @param forwardedRef - Ref receiving the created JointJS paper instance.
 * @returns JSX for paper host and portaled paper content.
 */
function PaperBase<ElementData = FlatElementData>(
  props: Readonly<PaperProps<ElementData>>,
  forwardedRef: React.ForwardedRef<dia.Paper | null>
) {
  const { className, style, children, width, height } = props;
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paper, paperStore, isReady, content } = useCreateReactPaper({
    ...props,
    elementRef: paperHTMLElementRef,
  });

  useImperativeHandle<dia.Paper | null, dia.Paper | null>(forwardedRef, () => paper ?? null, [
    paper,
  ]);

  const paperContainerStyle = useMemo((): CSSProperties => {
    if (style) {
      return style;
    }
    return {
      width: width ?? '100%',
      height: height ?? '100%',
    };
  }, [height, style, width]);

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div className={className} ref={paperHTMLElementRef} style={paperContainerStyle}>
        {isReady && content}
      </div>
      {isReady && children}
    </PaperStoreContext.Provider>
  );
}

export const Paper = forwardRef(PaperBase) as <ElementData = FlatElementData>(
  props: Readonly<PaperProps<ElementData>> & {
    ref?: React.Ref<dia.Paper | null>;
  }
) => ReturnType<typeof PaperBase>;
