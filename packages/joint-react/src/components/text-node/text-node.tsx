import { util, V, type Vectorizer } from '@joint/core';
import { forwardRef, useEffect, type SVGTextElementAttributes } from 'react';
import { useCombinedRef } from '../../hooks/use-combined-ref';

export interface TextNodeProps
  extends SVGTextElementAttributes<SVGTextElement>,
    Vectorizer.TextOptions {
  readonly separator?: string | unknown;
  readonly eol?: string;
  readonly ellipsis?: boolean | string;
  readonly hyphen?: string | RegExp;
  readonly maxLineCount?: number;
  readonly preserveSpaces?: boolean;
  readonly isLineBreakEnabled?: boolean;
  readonly width?: number;
  readonly height?: number;
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

    separator,
    hyphen,
    ellipsis,
    maxLineCount,
    preserveSpaces,
    isLineBreakEnabled,
    ...rest
  } = props;

  const textRef = useCombinedRef<SVGTextElement>(ref);
  useEffect(() => {
    if (!textRef.current) {
      return;
    }

    // util.breakText()
    if (typeof children !== 'string') {
      throw new TypeError('TextNode children must be a string');
    }

    let text = children;
    if (isLineBreakEnabled) {
      if (width === undefined) {
        throw new TypeError('TextNode width must be defined when isLineBreakEnabled is true');
      }
      text = util.breakText(
        text,
        { width, height },
        {},
        { ellipsis, eol, hyphen, maxLineCount, preserveSpaces, separator }
      );
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
    ellipsis,
    eol,
    height,
    hyphen,
    includeAnnotationIndices,
    isLineBreakEnabled,
    lineHeight,
    maxLineCount,
    preserveSpaces,
    separator,
    textPath,
    textRef,
    textVerticalAnchor,
    width,
    x,
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
