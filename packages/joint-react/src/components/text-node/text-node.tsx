import { util, V, type Vectorizer } from '@joint/core';
import { forwardRef, useEffect, type SVGTextElementAttributes } from 'react';
import { useCombinedRef } from '../../hooks/use-combined-ref';
import { isNumber } from '../../utils/is';
import { useCellId, useGraph } from '../../hooks';

export interface TextNodeProps
  extends SVGTextElementAttributes<SVGTextElement>,
    Vectorizer.TextOptions {
  readonly eol?: string;
  readonly width?: number;
  readonly height?: number;
  readonly textWrap?: boolean | util.BreakTextOptions;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: TextNodeProps, ref: React.ForwardedRef<SVGTextElement>) {
  const {
    children,
    eol,
    x,
    textVerticalAnchor,
    lineHeight,
    textPath,
    annotations,
    includeAnnotationIndices,
    displayEmpty,
    width,
    height,
    textWrap,
    ...rest
  } = props;

  const textRef = useCombinedRef<SVGTextElement>(ref);
  const cellId = useCellId();
  const graph = useGraph();
  useEffect(() => {
    if (!textRef.current) {
      return;
    }

    if (typeof children !== 'string') {
      throw new TypeError('TextNode children must be a string');
    }

    let text = children;
    if (textWrap) {
      let breakTextWidth = width;

      if (isNumber(breakTextWidth)) {
        breakTextWidth = Math.max(0, breakTextWidth);
      } else if (breakTextWidth == undefined) {
        const element = graph.getCell(cellId);
        if (!element.isElement()) {
          throw new TypeError('TextNode must be used inside a MeasuredNode');
        }
        breakTextWidth = element.size().width;
      }

      const options: util.BreakTextOptions = typeof textWrap === 'object' ? textWrap : {};
      text = util.breakText(text, { width: breakTextWidth, height }, {}, options);
    }

    V(textRef.current).text(text, {
      textVerticalAnchor,
      lineHeight,
      annotations,
      displayEmpty,
      eol,
      includeAnnotationIndices,
      textPath,
      x,
    });
  }, [
    annotations,
    children,
    displayEmpty,
    eol,
    height,
    includeAnnotationIndices,
    textWrap,
    lineHeight,
    textPath,
    textRef,
    textVerticalAnchor,
    width,
    x,
    graph,
    cellId,
  ]);
  return <text ref={textRef} {...rest} x={x} />;
}

/**
 * TextNode component is a wrapper around the SVG text element that provides additional functionality for rendering text.
 * It uses the Vectorizer library to handle text rendering and annotations.
 * It allows you to specify various text options such as end-of-line characters, vertical alignment, line height, and more.
 * @see Vectorizer
 * @see Vectorizer.TextOptions
 * @group Components
 * @returns The rendered SVG text element with the specified properties.
 */
export const TextNode = forwardRef(Component);
