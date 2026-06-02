import { StrictMode } from 'react';

/**
 * Wraps a story in `React.StrictMode` so double-invoked renders / effects and
 * cleanup regressions surface during development (especially on React 19).
 * @param Story - The story component to render.
 * @returns The story wrapped in `StrictMode`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withStrictMode(Story: any) {
  return (
    <StrictMode>
      <Story />
    </StrictMode>
  );
}
