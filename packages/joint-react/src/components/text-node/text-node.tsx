import { util, V, type Vectorizer } from '@joint/core';
import { forwardRef, useEffect, type SVGTextElementAttributes } from 'react';
import { useCombinedRef } from '../../hooks/use-combined-ref';

export interface TextNodeProps
  extends SVGTextElementAttributes<SVGTextElement>,
    Vectorizer.TextOptions {
  readonly eol?: string;

  readonly width?: number;
  readonly height?: number;

  readonly isTextWrapEnabled?: boolean;
  readonly ellipsis?: string | boolean;
  readonly textWrapEol?: string;
  readonly hyphen?: string | RegExp;
  readonly maxLineCount?: number;
  readonly preserveSpaces?: boolean;
  readonly separator?: string | unknown;
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
    isTextWrapEnabled,
    textWrapEol,
    ...rest
  } = props;

  const textRef = useCombinedRef<SVGTextElement>(ref);
  useEffect(() => {
    if (!textRef.current) {
      return;
    }

    if (typeof children !== 'string') {
      throw new TypeError('TextNode children must be a string');
    }

    let text = children;
    if (isTextWrapEnabled) {
      if (width === undefined) {
        throw new TypeError('TextNode width must be defined when isTextWrapEnabled is true');
      }
      text = util.breakText(
        text,
        { width, height },
        {},
        { ellipsis, eol: textWrapEol, hyphen, maxLineCount, preserveSpaces, separator }
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
    isTextWrapEnabled,
    lineHeight,
    maxLineCount,
    preserveSpaces,
    separator,
    textPath,
    textRef,
    textVerticalAnchor,
    textWrapEol,
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
