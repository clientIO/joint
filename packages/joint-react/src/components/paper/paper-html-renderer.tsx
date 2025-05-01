import {
  forwardRef,
  memo,
  useEffect,
  useMemo,
  type CSSProperties,
  type PropsWithChildren,
  type Ref,
} from 'react';
import { usePaper } from '../../hooks';
import { useCombinedRef } from '../../hooks/use-combined-ref';
import { V } from '@joint/core';
import { createPortal } from 'react-dom';
/**
 * Helper paper render component wrapped in a portal.
 * This component is used to render a paper element inside a portal.
 * @param _ - The props for the component, we use empty props and its ts bug in react.
 * @param ref - The ref for the component.
 * @group Components
 * @description
 * @returns The rendered element inside the portal.
 * This component is used to render a paper element inside a portal.
 */
function Component(_: PropsWithChildren, ref: Ref<HTMLDivElement>) {
  const paper = usePaper();
  const divRef = useCombinedRef(ref);

  useEffect(() => {
    // apply the transformation to the HTML element
    paper.on('transform', function () {
      // Update the transformation of all JointJS HTML Elements
      // var htmlContainer = this.htmlContainer;
      if (!divRef.current) {
        return;
      }
      divRef.current.style.width = paper.el.style.width;
      divRef.current.style.height = paper.el.style.height;
      divRef.current.style.transformOrigin = '0 0';
      divRef.current.style.transform = V.matrixToTransformString(paper.matrix());
    });
    return () => {
      // Remove the event listener when the component is unmounted
      paper.off('transform');
    };
  }, [divRef, paper]);

  const style = useMemo(
    (): CSSProperties => ({
      width: paper.el.style.width,
      height: paper.el.style.height,
      position: 'absolute',
      left: '0px',
      top: '0px',
      pointerEvents: 'none',
      overflow: 'hidden',
    }),
    [paper.el.style.height, paper.el.style.width]
  );

  const element = <div ref={divRef} style={style} />;

  return createPortal(element, paper.el);
}

export const PaperHtmlRendererContainer = memo(forwardRef(Component));
