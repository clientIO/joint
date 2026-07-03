import { renderHook, act, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useImperativeApi } from '../use-imperative-api';

interface FakeInstance {
  readonly id: number;
  readonly disposed: () => boolean;
}

let instanceCounter = 0;
function makeInstance(): { instance: FakeInstance; cleanup: () => void } {
  instanceCounter += 1;
  let isDisposed = false;
  const instance: FakeInstance = {
    id: instanceCounter,
    disposed: () => isDisposed,
  };
  return {
    instance,
    cleanup: () => {
      isDisposed = true;
    },
  };
}

beforeEach(() => {
  instanceCounter = 0;
});

function useTestApi() {
  const ref = useRef<FakeInstance>(null);
  const handle = useImperativeApi<FakeInstance>(
    {
      onLoad: makeInstance,
      forwardedRef: ref,
    },
    []
  );
  return { handle, ref };
}

describe('useImperativeApi', () => {
  it('creates an instance, marks ready, and tears it down on unmount', async () => {
    const onReadyChange = jest.fn();
    const { result, unmount } = renderHook(() =>
      useImperativeApi(
        {
          onLoad: makeInstance,
          onReadyChange,
        },
        []
      )
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    const created = result.current.ref.current;
    expect(created).not.toBeNull();
    expect(onReadyChange).toHaveBeenCalledWith(true, expect.any(Object));
    unmount();
    expect(created?.disposed()).toBe(true);
  });

  it('isDisabled=true after mount tears down and notifies not-ready (lines 129–130)', async () => {
    const onReadyChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ isDisabled }: { isDisabled: boolean }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
            onReadyChange,
            isDisabled,
          },
          []
        ),
      { initialProps: { isDisabled: false } }
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    onReadyChange.mockClear();
    rerender({ isDisabled: true });
    await waitFor(() => expect(result.current.isReady).toBe(false));
    expect(onReadyChange).toHaveBeenCalledWith(false, null);
  });

  it('starts disabled and creates the instance once enabled', async () => {
    const onReadyChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ isDisabled }: { isDisabled: boolean }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
            onReadyChange,
            isDisabled,
          },
          []
        ),
      { initialProps: { isDisabled: true } }
    );
    expect(result.current.isReady).toBe(false);
    rerender({ isDisabled: false });
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });

  it('fires onUpdate when dependencies change after the first mount (lines 157–168)', async () => {
    const onUpdate = jest.fn();
    const { rerender } = renderHook(
      ({ dep }: { dep: number }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
            onUpdate,
          },
          [dep]
        ),
      { initialProps: { dep: 1 } }
    );
    expect(onUpdate).not.toHaveBeenCalled();
    rerender({ dep: 2 });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [[, reset]] = onUpdate.mock.calls;
    expect(typeof reset).toBe('function');
  });

  it('honors the optional cleanup function returned from onUpdate (lines 170–172)', async () => {
    const cleanup = jest.fn();
    const onUpdate = jest.fn(() => cleanup);
    const { rerender, unmount } = renderHook(
      ({ dep }: { dep: number }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
            onUpdate,
          },
          [dep]
        ),
      { initialProps: { dep: 1 } }
    );
    rerender({ dep: 2 });
    rerender({ dep: 3 });
    // Each new dep change runs cleanup of the previous onUpdate before the new one.
    expect(cleanup).toHaveBeenCalledTimes(1);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('reset() inside onUpdate triggers a fresh onLoad', async () => {
    const onUpdate = jest.fn(
      (_instance: FakeInstance, reset: () => void) => {
        reset();
      }
    );
    const { result, rerender } = renderHook(
      ({ dep }: { dep: number }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
            onUpdate,
          },
          [dep]
        ),
      { initialProps: { dep: 1 } }
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    const firstId = result.current.ref.current?.id;
    rerender({ dep: 2 });
    await waitFor(() => expect(result.current.ref.current?.id).not.toBe(firstId));
  });

  it('does NOT fire onUpdate when dependency length changes only and instance is null (line 165)', async () => {
    // Hits the `if (!instance) return;` early-out (line 165) by switching
    // to disabled (which nulls instanceRef.current) at the same time as
    // bumping a dep. The onUpdate effect runs because dep changed; the
    // instance is null → early return.
    const onUpdate = jest.fn();
    const { rerender } = renderHook(
      ({ dep, isDisabled }: { dep: number; isDisabled: boolean }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
            onUpdate,
            isDisabled,
          },
          [dep]
        ),
      { initialProps: { dep: 1, isDisabled: true } }
    );
    rerender({ dep: 2, isDisabled: true });
    // Instance is null while disabled; onUpdate must not see a non-null instance.
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('forwards the instance through forwardedRef and applies an instanceSelector (lines 182–183)', async () => {
    const forwardedRef = { current: null as { selectedId: number } | null };
    const { result, unmount } = renderHook(() =>
      useImperativeApi<FakeInstance, { selectedId: number }>(
        {
          onLoad: makeInstance,
          forwardedRef,
          instanceSelector: (instance) => ({ selectedId: instance.id }),
        },
        []
      )
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(typeof forwardedRef.current?.selectedId).toBe('number');
    expect(forwardedRef.current?.selectedId).toBeGreaterThan(0);
    unmount();
  });

  it('uses identity selector on forwardedRef when instanceSelector is omitted', async () => {
    const forwardedRef = { current: null as FakeInstance | null };
    const { result } = renderHook(() =>
      useImperativeApi<FakeInstance>(
        {
          onLoad: makeInstance,
          forwardedRef,
        },
        []
      )
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(forwardedRef.current).toEqual(result.current.ref.current);
  });

  it('forwardedRef receives null when the instance is not ready', () => {
    // Run with isDisabled=true so the instance is never created — the
    // imperative-handle factory returns null on the first invocation.
    const forwardedRef = { current: null as FakeInstance | null };
    renderHook(() =>
      useImperativeApi<FakeInstance>(
        {
          onLoad: makeInstance,
          forwardedRef,
          isDisabled: true,
        },
        []
      )
    );
    expect(forwardedRef.current).toBeNull();
  });

  it('does not fire onUpdate when dependency identity is unchanged across renders', async () => {
    const onUpdate = jest.fn();
    const { rerender } = renderHook(
      ({ dep }: { dep: number }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
            onUpdate,
          },
          [dep]
        ),
      { initialProps: { dep: 1 } }
    );
    rerender({ dep: 1 });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('skips onUpdate without an onUpdate option (early return line 152–154)', async () => {
    const { rerender } = renderHook(
      ({ dep }: { dep: number }) =>
        useImperativeApi(
          {
            onLoad: makeInstance,
          },
          [dep]
        ),
      { initialProps: { dep: 1 } }
    );
    expect(() => rerender({ dep: 2 })).not.toThrow();
  });

  it('integrates with a real component-style usage pattern', async () => {
    const { result } = renderHook(() => useTestApi());
    await waitFor(() => expect(result.current.handle.isReady).toBe(true));
    expect(result.current.ref.current?.id).toBeGreaterThan(0);
    act(() => {
      // No-op act to flush layout effects.
    });
  });
});
