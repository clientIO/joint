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
 * Props for {@link HTMLBox}. Same shape as {@link HTMLHostProps}: `className` is
 * merged with the `jj-box` class and `style` is layered on top of the default
 * box styling before reaching the underlying {@link HTMLHost}; the rest pass
 * through unchanged.
 * @expand
 * @group Types
 */
export interface HTMLBoxProps extends HTMLHostProps {}

/**
 * Renders a graph element as a pre-styled HTML box. Reach for this inside
 * `<Paper renderElement={...}>` when you want elements that already look good
 * without writing any CSS.
 *
 * Wraps {@link HTMLHost} and adds the `jj-box` class, which themes the box
 * through `--jj-box-*` CSS variables (background, border, radius, padding,
 * font). Like {@link HTMLHost}, it measures its content and syncs the size back
 * to the element by default; set `useModelGeometry` to size it from the model
 * instead. All props reach the underlying {@link HTMLHost}; `className` is merged
 * with the `jj-box` class and `style` is layered on top of the default box
 * styling, while the rest pass through unchanged. Use {@link HTMLHost} directly
 * when you want a blank host with no default styling.
 * @example
 * ```tsx
 * import { Paper, HTMLBox } from '@joint/react';
 *
 * // Each element renders as a ready-styled box showing its label.
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
