/* eslint-disable @eslint-react/no-create-ref */
/* eslint-disable react-perf/jsx-no-new-array-as-prop -- the recorder is per-test state */
import { render, screen } from '@testing-library/react';
import { createRef, useLayoutEffect, type ReactNode, type Ref } from 'react';
import { useCombinedRef } from '../use-combined-ref';

/**
 * `useCombinedRef` must assign the forwarded ref DURING COMMIT — like any DOM ref —
 * not in a passive effect, or a consumer that reads it in a layout effect sees `null`.
 *
 * React attaches refs during commit, before layout effects run, and consumers are
 * entitled to rely on that. Assigning in a passive effect instead:
 *
 * ```ts
 * useEffect(() => { setForwardRef(ref, innerRef.current); }, [ref]);
 * ```
 *
 * means a parent that renders `<SVGText ref={myRef} />` and reads `myRef.current` in
 * its own `useLayoutEffect` sees `null` — parent layout effects run before any passive
 * effect.
 *
 * `useMeasureElement` is exactly that consumer. It reads `nodeRef.current` in a layout
 * effect and returns early when the ref is empty, and its dependency list —
 * `[nodeRef, graph, id, paper, setMeasuredNode]` — contains nothing that changes when
 * the node is finally assigned, so it never registers the node with the size observer.
 * The element then stays 0x0 permanently: no size, and no layout for anything that
 * reads sizes.
 *
 * Two things hid this everywhere it would otherwise show up:
 *
 * 1. StrictMode remounts effects, so a second pass finds the ref already set by the
 *    first pass. It is on for every story (`.storybook/preview.ts`) and for every test
 *    (`configure({ reactStrictMode: true })` in `jest-setup.ts`) — which is why the
 *    suite below has to opt out explicitly to see the bug.
 * 2. None of the library's own examples pass a ref to `SVGText`. The flowchart,
 *    svg-node and portal-selectors stories put a plain DOM ref on a native `<text>`,
 *    and the `SVGText` story measures a `<g>` wrapper.
 *
 * Found in an app that measured `SVGText` directly: correct in development, every node
 * rendered as a bare label with no shape and no layout once built for production,
 * where effects run once.
 */

/** Records what the parent's layout effect saw, in order. */
function Harness({ forwardedRef, seen }: Readonly<{
  forwardedRef: Ref<HTMLDivElement>;
  seen: Array<HTMLDivElement | null>;
}>) {
  const ref = forwardedRef as { current: HTMLDivElement | null };
  useLayoutEffect(() => {
    seen.push(ref.current);
  }, [ref, seen]);
  return <Child forwardedRef={forwardedRef} />;
}

function Child({ forwardedRef }: Readonly<{ forwardedRef: Ref<HTMLDivElement> }>): ReactNode {
  // Stands in for `SVGText`, whose only relevant behaviour here is that it forwards its
  // ref through `useCombinedRef`.
  const combinedRef = useCombinedRef<HTMLDivElement>(forwardedRef);
  return <div data-testid="el" ref={combinedRef} />;
}

describe('useCombinedRef ref-assignment timing', () => {
  it('assigns the forwarded ref before a consumer layout effect runs', () => {
    const ref = createRef<HTMLDivElement>();
    const seen: Array<HTMLDivElement | null> = [];

    // `reactStrictMode: false` is the whole point: effects run once, as they do in any
    // production build. With the suite-wide StrictMode left on, the remount masks this.
    render(<Harness forwardedRef={ref} seen={seen} />, { reactStrictMode: false });

    // The parent's layout effect must have seen the node, not null: the ref is assigned
    // during commit, before layout effects run.
    expect(seen).toEqual([screen.getByTestId('el')]);
  });

  it('is masked by StrictMode, which is why nothing caught it', () => {
    const ref = createRef<HTMLDivElement>();
    const seen: Array<HTMLDivElement | null> = [];

    render(<Harness forwardedRef={ref} seen={seen} />, { reactStrictMode: true });

    // The remount leaves a correct ref behind, so a consumer whose layout effect runs
    // more than once recovers. Deliberately asserts only the final value: this holds
    // both before and after a fix, so it is documentation rather than something that
    // has to change when `useCombinedRef` is corrected.
    expect(seen.length).toBeGreaterThan(1);
    expect(seen.at(-1)).toBe(screen.getByTestId('el'));
  });

  it('has assigned the ref by the time render returns, which is what the existing tests assert', () => {
    const ref = createRef<HTMLDivElement>();
    const seen: Array<HTMLDivElement | null> = [];

    render(<Harness forwardedRef={ref} seen={seen} />, { reactStrictMode: false });

    // Passing here is not evidence of correctness: passive effects have flushed by now.
    // The defect is only visible from inside a layout effect.
    expect(ref.current).toBe(screen.getByTestId('el'));
  });
});
