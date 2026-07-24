import type { Decorator } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Showcase } from '../../stories/ui/showcase';
import { Badge } from '../../stories/ui/badge';
import type { CodeFile } from '../../stories/ui/code-block';

/**
 * Per-story frame configuration, set via `parameters.showcase`. All fields are
 * optional; the frame derives sensible defaults from the story's title/name.
 * Set `parameters.showcase = false` to opt a story out of the frame entirely.
 */
interface ShowcaseParameters {
  /** One-line description. Deep docs live in joint-docs, keep this to a sentence. */
  readonly description?: ReactNode;
  /** Auto-injected source, always via a `?raw` import — never a hand-written string. */
  readonly code?: string;
  /** Multiple named `?raw` snippets, rendered as tabs. */
  readonly files?: readonly CodeFile[];
  /** Filename label for a single `code` snippet. */
  readonly filename?: string;
  /** Link to the matching API reference page. */
  readonly apiUrl?: string;
  /** Override the auto-derived title. */
  readonly title?: string;
  /** Canvas height in px. Default 420. */
  readonly canvasHeight?: number | string;
  /** Render the diagram surface without the dot grid. */
  readonly plainCanvas?: boolean;
  /** Skip the canvas surface — for full-app demos that own their background. */
  readonly bare?: boolean;
}

const EYEBROWS: Record<string, string> = {
  Examples: 'Example',
  Demos: 'Demo',
  Components: 'Component',
  Utils: 'Utility',
  Hooks: 'Hook',
};

function eyebrowFor(group: string): string {
  return EYEBROWS[group] ?? group.replace(/s$/, '');
}

/**
 * Wraps every story in the unified {@link Showcase} frame. Title and category
 * eyebrow are derived from the Storybook `title`; the source snippet and
 * description come from `parameters.showcase`.
 */
export const withShowcase: Decorator = (Story, context) => {
  const showcase = context.parameters?.showcase as ShowcaseParameters | false | undefined;
  if (showcase === false) {
    return <Story />;
  }

  const segments = context.title.split('/');
  const group = segments[0] ?? '';
  const base = segments.at(-1) ?? context.title;
  const storyName = context.name;
  const isVariant = storyName !== 'Default' && storyName !== base;

  return (
    <Showcase
      title={showcase?.title ?? base}
      eyebrow={eyebrowFor(group)}
      badge={isVariant ? <Badge>{storyName}</Badge> : undefined}
      description={showcase?.description}
      apiUrl={showcase?.apiUrl}
      code={showcase?.code}
      files={showcase?.files}
      filename={showcase?.filename}
      canvasHeight={showcase?.canvasHeight}
      plainCanvas={showcase?.plainCanvas}
      bare={showcase?.bare}
    >
      <Story />
    </Showcase>
  );
};
