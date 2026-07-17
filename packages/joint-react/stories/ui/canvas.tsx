import { useMemo, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CanvasProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed pixel height of the drawing area. Default 420. */
  readonly height?: number | string;
  /** Hide the graph-paper dot grid (for stories that own their background). */
  readonly plain?: boolean;
}

/**
 * The diagram drawing surface. Provides the unified graph-paper backdrop,
 * inset framing, and a definite height so a child `<Paper>` (rendered with
 * `size-full`) fills it. This is where every JointJS canvas lives.
 * @group Storybook UI
 * @example
 * ```tsx
 * <Canvas height={360}>
 *   <Paper className="size-full" renderElement={renderElement} />
 * </Canvas>
 * ```
 */
export function Canvas({
  height = 420,
  plain,
  className,
  style,
  children,
  ...rest
}: Readonly<CanvasProps>) {
  const mergedStyle = useMemo<CSSProperties>(() => ({ height, ...style }), [height, style]);
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-[--radius-control]',
        'ring-1 ring-inset ring-hairline',
        plain ? 'bg-canvas' : 'jj-dotgrid',
        className
      )}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
