import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'brand' | 'accent';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: Tone;
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-muted border-hairline-strong',
  brand: 'bg-brand/12 text-brand border-brand/30',
  accent: 'bg-accent/12 text-accent border-accent/30',
};

/**
 * Small status/label pill for story metadata (tags, states, counts).
 * @group Storybook UI
 */
export function Badge({ tone = 'neutral', className, ...rest }: Readonly<BadgeProps>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-[11px] font-medium leading-none tracking-wide',
        TONES[tone],
        className
      )}
      {...rest}
    />
  );
}
