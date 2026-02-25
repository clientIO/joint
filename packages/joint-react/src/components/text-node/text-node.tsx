import type { dia } from '@joint/core';
import { util, V, type Vectorizer } from '@joint/core';
import React, { forwardRef, useEffect, type SVGTextElementAttributes } from 'react';
import { useCombinedRef } from '../../hooks/use-combined-ref';
import { isNumber } from '../../utils/is';
import { useCellId, useGraph } from '../../hooks';

interface BreakTextWidthOptions {
  readonly width: number | undefined;
  readonly graph: ReturnType<typeof useGraph>;
  readonly cellId: dia.Cell.ID;
}

interface TextWrapStylesOptions {
  readonly lineHeight: Vectorizer.TextOptions['lineHeight'];
  readonly fontWeight: SVGTextElementAttributes<SVGTextElement>['fontWeight'];
  readonly fontFamily: SVGTextElementAttributes<SVGTextElement>['fontFamily'];
  readonly fontSize: SVGTextElementAttributes<SVGTextElement>['fontSize'];
  readonly letterSpacing: SVGTextElementAttributes<SVGTextElement>['letterSpacing'];
  readonly style?: React.CSSProperties;
}

function getBreakTextWidth({ width, graph, cellId }: BreakTextWidthOptions) {
  if (isNumber(width)) {
    return Math.max(0, width);
  }

  if (width != undefined) {
    return width;
  }

  const element = graph.getCell(cellId);
  if (!element.isElement()) {
    throw new TypeError('TextNode must be used with useNodeSize hook to measure the element size');
  }

  return element.size().width ?? 0;
}

function getTextWrapStyles({
  lineHeight,
  fontWeight,
  fontFamily,
  fontSize,
  letterSpacing,
  style,
}: TextWrapStylesOptions) {
  const textWrapStyles: Record<string, string | number> = {};
  // we check for undefined, and if undefined check also style object
  if (fontWeight != undefined) {
    textWrapStyles['font-weight'] = fontWeight;
  } else if (style?.fontWeight != undefined) {
    textWrapStyles['font-weight'] = style.fontWeight;
  }

  if (fontFamily != undefined) {
    textWrapStyles['font-family'] = fontFamily;
  } else if (style?.fontFamily != undefined) {
    textWrapStyles['font-family'] = style.fontFamily;
  }

  if (fontSize != undefined) {
    textWrapStyles['font-size'] = fontSize;
  } else if (style?.fontSize != undefined) {
    textWrapStyles['font-size'] = style.fontSize;
  }

  if (letterSpacing != undefined) {
    textWrapStyles['letter-spacing'] = letterSpacing;
  } else if (style?.letterSpacing != undefined) {
    textWrapStyles['letter-spacing'] = style.letterSpacing;
  }

  if (style?.textTransform != undefined) {
    textWrapStyles['text-transform'] = style.textTransform;
  }

  if (lineHeight != undefined) {
    textWrapStyles['line-height'] = lineHeight;
  } else if (style?.lineHeight != undefined) {
    textWrapStyles['line-height'] = style.lineHeight;
  }

  return textWrapStyles;
}

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
    fontWeight,
    fontFamily,
    fontSize,
    letterSpacing,
    style,
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
      const breakTextWidth = getBreakTextWidth({ width, graph, cellId });
      const options: util.BreakTextOptions = typeof textWrap === 'object' ? textWrap : {};
      const textWrapStyles = getTextWrapStyles({
        lineHeight,
        fontWeight,
        fontFamily,
        fontSize,
        letterSpacing,
        style,
      });
      text = util.breakText(text, { width: breakTextWidth, height }, textWrapStyles, options);
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
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    graph,
    cellId,
    style,
  ]);
  return (
    <text
      ref={textRef}
      {...rest}
      x={x}
      fontWeight={fontWeight}
      fontFamily={fontFamily}
      fontSize={fontSize}
      letterSpacing={letterSpacing}
      style={style}
    />
  );
}

/**
 * TextNode component is a wrapper around the SVG text element that provides additional functionality for rendering text.
 * It uses the Vectorizer library to handle text rendering and annotations.
 * It allows you to specify various text options such as end-of-line characters, vertical alignment, line height, and more.
 * @see Vectorizer
 * @see Vectorizer.TextOptions
 * @group Components
 * @returns The rendered SVG text element with the specified properties.
 * @example
 * Basic usage:
 * ```tsx
 * import { TextNode } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <TextNode x={10} y={20}>
 *       Hello World
 *     </TextNode>
 *   );
 * }
 * ```
 * @example
 * With text wrapping:
 * ```tsx
 * import { TextNode } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <TextNode x={10} y={20} width={100} textWrap>
 *       This is a long text that will wrap to multiple lines
 *     </TextNode>
 *   );
 * }
 * ```
 * @example
 * With custom text options:
 * ```tsx
 * import { TextNode } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <TextNode
 *       x={10}
 *       y={20}
 *       textVerticalAnchor="middle"
 *       lineHeight={1.5}
 *       eol="\n"
 *     >
 *       Line 1\nLine 2
 *     </TextNode>
 *   );
 * }
 * ```
 */
export const TextNode = forwardRef(Component);
