import { util, V, type Vectorizer } from '@joint/core';
import { useEffect, useRef, type SVGTextElementAttributes } from 'react';

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

// separator?: string | any;
// eol?: string;
// ellipsis?: boolean | string;
// hyphen?: string | RegExp;
// maxLineCount?: number;
// preserveSpaces?: boolean;
/**
 * TextNode component is a wrapper around the SVG text element that provides additional functionality for rendering text.
 * It uses the Vectorizer library to handle text rendering and annotations.
 * It allows you to specify various text options such as end-of-line characters, vertical alignment, line height, and more.
 * @see Vectorizer
 * @see Vectorizer.TextOptions
 * @group Components
 * @param props - The properties for the TextNode component.
 * @param props.children - The text content to be rendered.
 * @param props.eol - The end-of-line character(s) to be used for line breaks.
 * @param props.x - The x-coordinate for the text position.
 * @param props.textVerticalAnchor - The vertical alignment of the text.
 * @param props.lineHeight - The line height for the text.
 * @param props.textPath - The text path for the text to follow.
 * @param props.annotations - An array of text annotations to be applied to the text.
 * @param props.includeAnnotationIndices - Whether to include annotation indices in the text.
 * @param props.displayEmpty - Whether to display empty text.
 * @returns The rendered SVG text element with the specified properties.
 */
export function TextNode(props: TextNodeProps) {
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

  const textRef = useRef<SVGTextElement>(null);
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
    textVerticalAnchor,
    width,
    x,
  ]);
  return <text ref={textRef} {...rest} x={x} />;
}
