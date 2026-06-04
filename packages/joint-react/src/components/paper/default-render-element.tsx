import type { ReactNode } from 'react';
import { HTMLBox } from '../html-box';
import type { RenderElement } from './paper.types';

/**
 * Default element renderer used by `<Paper>` when no `renderElement` is given:
 * a themed `HTMLBox` showing `data.label`. Shared by the client portal renderer
 * and the server tree builder so the first paint matches on both.
 * @param data - the element's `data` slice.
 * @returns the default element content.
 */
export const defaultRenderElement: RenderElement<Record<string, unknown>> = (data) => {
  const label = (data as { label?: ReactNode } | undefined)?.label;
  return <HTMLBox>{label}</HTMLBox>;
};
