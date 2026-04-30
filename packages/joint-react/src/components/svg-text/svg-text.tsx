import { type dia, util, V, type Vectorizer } from '@joint/core';
import React, { forwardRef, useContext, useEffect, type SVGTextElementAttributes } from 'react';
import type { CellId } from '../../types/cell.types';
import { useCombinedRef } from '../../hooks/use-combined-ref';
import { isNumber } from '../../utils/is';
import { useGraph } from '../../hooks';
import { CellIdContext } from '../../context';

/** Options for resolving text wrap width. */
interface BreakTextWidthOptions {
  readonly width: number | undefined;
  readonly graph: dia.Graph;
  readonly cellId: CellId;
}

interface TextWrapStylesOptions {
  readonly lineHeight: Vectorizer.TextOptions['lineHeight'];
  readonly fontWeight: SVGTextElementAttributes<SVGTextElement>['fontWeight'];
  readonly fontFamily: SVGTextElementAttributes<SVGTextElement>['fontFamily'];
  readonly fontSize: SVGTextElementAttributes<SVGTextElement>['fontSize'];
  readonly letterSpacing: SVGTextElementAttributes<SVGTextElement>['letterSpacing'];
  readonly style?: React.CSSProperties;
}

/**
 * Resolves the effective break-text width for text wrapping.
 * @param options - The break text width options.
 * @param options.width - Explicit width override.
 * @param options.graph - The graph instance.
 * @param options.cellId - The cell identifier.
 * @returns The resolved width value.
 */
function getBreakTextWidth({ width, graph, cellId }: BreakTextWidthOptions) {
  if (isNumber(width)) {
    return Math.max(0, width);
  }

  if (width != undefined) {
    return width;
  }

  const element = graph.getCell(cellId);
  if (!element.isElement()) {
    throw new TypeError('SVGText must be used with useMeasureNode hook to measure the element size');
  }

  return element.size().width ?? 0;
}

/**
 * Builds a style object for text wrapping from component props.
 * @param options - The text wrap style options.
 * @param options.lineHeight - Line height value.
 * @param options.fontWeight - Font weight value.
 * @param options.fontFamily - Font family value.
 * @param options.fontSize - Font size value.
 * @param options.letterSpacing - Letter spacing value.
 * @param options.style - Optional inline CSS styles as fallback.
 * @returns A record of CSS property names to values for text wrapping.
 */
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

/**
 * Props for `SVGText` — combines native SVG `<text>` attributes with the
 * JointJS Vectorizer text options used for word-wrap and annotation rendering.
 */
export interface SVGTextProps
  extends SVGTextElementAttributes<SVGTextElement>,
    Vectorizer.TextOptions {
  readonly eol?: string;
  readonly width?: number;
  readonly height?: number;
  readonly textWrap?: boolean | util.BreakTextOptions;
}

 
function Component(props: SVGTextProps, ref: React.ForwardedRef<SVGTextElement>) {
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
  const cellIdValue = useContext(CellIdContext);
  if (cellIdValue === undefined) {
    throw new Error('SVGText must be used inside renderElement');
  }
  const cellId = cellIdValue;
  const { graph } = useGraph();
  useEffect(() => {
    if (!textRef.current) {
      return;
    }

    if (typeof children !== 'string') {
      throw new TypeError('SVGText children must be a string');
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
 * SVGText component is a wrapper around the SVG text element that provides additional functionality for rendering text.
 * It uses the Vectorizer library to handle text rendering and annotations.
 * It allows you to specify various text options such as end-of-line characters, vertical alignment, line height, and more.
 * @see Vectorizer
 * @see Vectorizer.TextOptions
 * @group Components
 * @returns The rendered SVG text element with the specified properties.
 * @example
 * Basic usage:
 * ```tsx
 * import { SVGText } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <SVGText x={10} y={20}>
 *       Hello World
 *     </SVGText>
 *   );
 * }
 * ```
 * @example
 * With text wrapping:
 * ```tsx
 * import { SVGText } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <SVGText x={10} y={20} width={100} textWrap>
 *       This is a long text that will wrap to multiple lines
 *     </SVGText>
 *   );
 * }
 * ```
 * @example
 * With custom text options:
 * ```tsx
 * import { SVGText } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <SVGText
 *       x={10}
 *       y={20}
 *       textVerticalAnchor="middle"
 *       lineHeight={1.5}
 *       eol="\n"
 *     >
 *       Line 1\nLine 2
 *     </SVGText>
 *   );
 * }
 * ```
 */
export const SVGText = forwardRef(Component);
