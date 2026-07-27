import type { ReactNode } from 'react';
import { cn } from './cn';
import { Canvas } from './canvas';
import { CodeBlock, type CodeFile } from './code-block';

export interface ShowcaseProps {
  /** Story title, e.g. "Card". */
  readonly title: string;
  /** Category eyebrow above the title, e.g. "Example". */
  readonly eyebrow?: string;
  /** Small chip beside the title, e.g. a variant name for multi-story files. */
  readonly badge?: ReactNode;
  /** One-line description. Keep it to a sentence; deep docs live in joint-docs. */
  readonly description?: ReactNode;
  /** Link to the matching API reference page. */
  readonly apiUrl?: string;
  /** Source shown in the built-in "Show code" panel. */
  readonly code?: string;
  /** Multiple named snippets (tabs) instead of a single `code`. */
  readonly files?: readonly CodeFile[];
  /** Filename for a single `code` snippet. */
  readonly filename?: string;
  /** Canvas height in px. Default 420. */
  readonly canvasHeight?: number | string;
  /** Render the diagram surface without the dot grid. */
  readonly plainCanvas?: boolean;
  /**
   * Skip the built-in Canvas surface and render children directly — for
   * full-app demos that own their own layout and background.
   */
  readonly bare?: boolean;
  /** Optional controls rendered in the header's top-right. */
  readonly actions?: ReactNode;
  /** The live story content (usually a `<Paper>`). */
  readonly children: ReactNode;
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className="opacity-70">
      <path d="M5 11L11 5M11 5H6M11 5V10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The unified story frame. Every @joint/react story renders inside one of
 * these, which is what makes the whole storybook read as a single product:
 * a branded eyebrow + title + one-line description, the graph-paper canvas,
 * and a built-in "Show code" panel.
 * @group Storybook UI
 * @example
 * ```tsx
 * <Showcase title="Card" eyebrow="Example" description="Custom sizing." code={raw}>
 *   <Paper className="size-full" renderElement={renderElement} />
 * </Showcase>
 * ```
 */
export function Showcase({
  title,
  eyebrow,
  badge,
  description,
  apiUrl,
  code,
  files,
  filename,
  canvasHeight,
  plainCanvas,
  bare,
  actions,
  children,
}: Readonly<ShowcaseProps>) {
  const hasCode = Boolean(code) || (files?.length ?? 0) > 0;
  return (
    <div className="min-h-full w-full bg-app px-4 py-6 sm:px-6 sm:py-8">
      <section
        className={cn(
          'jj-rise mx-auto flex w-full max-w-[1040px] flex-col gap-4 rounded-[--radius-panel]',
          'border border-hairline bg-surface p-4 sm:p-5',
          'shadow-[inset_0_1px_0_0_oklch(0.92_0.02_230/0.06),0_24px_60px_-36px_rgba(0,0,0,0.85)]'
        )}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            {eyebrow != null && (
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                {eyebrow}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[26px]">
                {title}
              </h1>
              {badge}
            </div>
            {description != null && (
              <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-ink-muted">{description}</p>
            )}
          </div>

          {(actions != null || apiUrl != null) && (
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              {apiUrl != null && (
                <a
                  href={apiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[--radius-control] border border-hairline-strong bg-surface-2/60 px-2.5 py-1.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
                >
                  API reference
                  <ArrowUpRight />
                </a>
              )}
            </div>
          )}
        </header>

        {bare ? (
          <div className="overflow-hidden rounded-[--radius-control] ring-1 ring-inset ring-hairline">
            {children}
          </div>
        ) : (
          <Canvas height={canvasHeight} plain={plainCanvas}>
            {children}
          </Canvas>
        )}

        {hasCode && <CodeBlock code={code} files={files} filename={filename} />}
      </section>
    </div>
  );
}
