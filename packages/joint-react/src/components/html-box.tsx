import { type CSSProperties } from 'react';
import { HTMLHost, type HTMLHostProps } from './html-host';

export type HTMLBoxProps = HTMLHostProps;

const BASE_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  overflow: 'hidden',
  textAlign: 'center',
  wordBreak: 'break-word',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const AUTO_SIZE_STYLE: CSSProperties = {
  minWidth: 80,
  minHeight: 40,
  maxWidth: 200,
};

/**
 * Default themed HTML host that applies the `jj-element` CSS class.
 * Wraps {@link HTMLHost} (style-neutral foreignObject + measured div) and adds
 * the `jj-element` class for default styling via `--jj-element-*` CSS variables.
 * All props are forwarded to HTMLHost.
 *
 * Use `HTMLHost` directly when you want full control without default styles.
 * Use `DefaultHTMLHost` for out-of-the-box themed appearance.
 * @param props - HTML div attributes plus optional `measure` flag.
 * @returns A themed HTMLHost element with the `jj-element` CSS class applied.
 * @example
 * ```tsx
 * <Paper renderElement={({ label }) => <DefaultHTMLHost>{label}</DefaultHTMLHost>} />
 * ```
 */
export function HTMLBox(props: Readonly<HTMLBoxProps> = {}) {
  const { className, style, useModelGeometry, ...rest } = props;
  const mergedClassName = className ? `jj-element ${className}` : 'jj-element';
  const baseStyle = useModelGeometry ? BASE_STYLE : { ...BASE_STYLE, ...AUTO_SIZE_STYLE };
  const mergedStyle = style ? { ...baseStyle, ...style } : baseStyle;
  return <HTMLHost
    {...rest}
    useModelGeometry={useModelGeometry}
    className={mergedClassName}
    style={mergedStyle}
  />;
}
