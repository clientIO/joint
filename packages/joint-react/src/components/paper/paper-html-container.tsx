import { memo, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { usePaper } from '../../hooks';
import { mvc, V } from '@joint/core';
import { createPortal } from 'react-dom';

interface Props {
  readonly onSetElement: (element: HTMLElement) => void;
}
// eslint-disable-next-line jsdoc/require-jsdoc
function Component({ onSetElement }: Readonly<Props>) {
  const paper = usePaper();
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paper || !divRef.current) {
      return;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    function transformElement() {
      if (!divRef.current) {
        return;
      }
      divRef.current.style.width = paper.el.style.width;
      divRef.current.style.height = paper.el.style.height;
      divRef.current.style.transformOrigin = '0 0';
      divRef.current.style.transform = V.matrixToTransformString(paper.matrix());
    }
    // apply the transformation to the HTML element
    const controller = new mvc.Listener();
    controller.listenTo(paper, 'transform', transformElement);
    // also we trigger the transform event when the paper is created or divRef is created - mean component mounted
    transformElement();
    onSetElement(divRef.current);

    return () => {
      controller.stopListening();
    };
  }, [divRef, onSetElement, paper]);

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
  return <>{createPortal(element, paper.el)}</>;
}

export const PaperHTMLContainer = memo(Component);
