import { type CSSProperties, type HTMLAttributes } from 'react';
import { HTMLHost } from './html-host';

export type DefaultElementProps = HTMLAttributes<HTMLDivElement>;

const DEFAULT_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  overflow: 'hidden',
  textAlign: 'center',
  wordBreak: 'break-word',
  minWidth: 80,
  maxWidth: 200,
};

/**
 * Themed element wrapper that applies the `jr-element` CSS class.
 * Wraps {@link HTMLHost} (style-neutral foreignObject + measured div) and adds
 * the `jr-element` class for default styling via `--jr-element-*` CSS variables.
 * All props are forwarded to HTMLHost.
 *
 * Use `HTMLHost` directly when you want full control without default styles.
 * Use `DefaultElement` for out-of-the-box themed appearance.
 * @param props - Standard HTML div attributes (children, style, className, event handlers, etc.).
 * @returns A themed HTMLHost element with the `jr-element` CSS class applied.
 * @example
 * ```tsx
 * <Paper renderElement={({ label }) => <DefaultElement>{label}</DefaultElement>} />
 * ```
 */
export function DefaultElement(props: Readonly<DefaultElementProps> = {}) {
  const { className, style, ...rest } = props;
  const mergedClassName = className ? `jr-element ${className}` : 'jr-element';
  const mergedStyle = style ? { ...DEFAULT_STYLE, ...style } : DEFAULT_STYLE;
  return <HTMLHost {...rest} className={mergedClassName} style={mergedStyle} />;
}
