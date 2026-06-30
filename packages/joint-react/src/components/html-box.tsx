import { type CSSProperties, type ReactNode } from 'react';
import { HTMLHost, type HTMLHostProps } from './html-host';

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
 * Props for the HTMLBox component, extending HTMLHostProps.
 * @expand
 * @group Types
 */
export interface HTMLBoxProps extends HTMLHostProps {}

/**
 * Default themed HTML host that applies the `jj-box` CSS class. Use inside
 * `<Paper renderElement={...}>` to render a graph element.
 *
 * Wraps {@link HTMLHost} (style-neutral foreignObject + measured div) and adds
 * the `jj-box` class for default styling via `--jj-box-*` CSS variables. All
 * props are forwarded to {@link HTMLHost}. Use {@link HTMLHost} directly when you want
 * full control without default styles.
 * @example
 * ```tsx
 * <Paper renderElement={({ label }) => <HTMLBox>{label}</HTMLBox>} />
 * ```
 * @group Components
 */
export function HTMLBox(props: Readonly<HTMLBoxProps> = {}): ReactNode {
  const { className, style, useModelGeometry, ...rest } = props;
  const mergedClassName = className ? `jj-box ${className}` : 'jj-box';
  const baseStyle = useModelGeometry ? BASE_STYLE : { ...BASE_STYLE, ...AUTO_SIZE_STYLE };
  const mergedStyle = style ? { ...baseStyle, ...style } : baseStyle;
  return <HTMLHost
    {...rest}
    useModelGeometry={useModelGeometry}
    className={mergedClassName}
    style={mergedStyle}
  />;
}
