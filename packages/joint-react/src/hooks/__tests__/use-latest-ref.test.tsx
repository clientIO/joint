import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { Suspense, startTransition, useCallback, useLayoutEffect, useState, type RefObject } from 'react';
import { useLatestRef } from '../use-latest-ref';

function LayoutReader({ valueRef, tick, record }: Readonly<{
  valueRef: RefObject<string>;
  tick: number;
  record: (value: string) => void;
}>) {
  useLayoutEffect(() => {
    record(valueRef.current);
  }, [valueRef, tick, record]);
  return null;
}

function Parent({ value, tick, record }: Readonly<{
  value: string;
  tick: number;
  record: (value: string) => void;
}>) {
  const valueRef = useLatestRef(value);
  return <LayoutReader valueRef={valueRef} tick={tick} record={record} />;
}

describe('useLatestRef commit timing', () => {
  it('publishes the new value before a descendant layout effect reads it', () => {
    const record = jest.fn();
    const { rerender } = render(<Parent value="before" tick={0} record={record} />);
    record.mockClear();

    rerender(<Parent value="after" tick={1} record={record} />);

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenLastCalledWith('after');
  });

  it('keeps its ref identity while updating the committed value', () => {
    const { result, rerender } = renderHook(({ value }) => useLatestRef(value), {
      initialProps: { value: 'before' },
    });
    const first = result.current;

    rerender({ value: 'after' });

    expect(result.current).toBe(first);
    expect(first.current).toBe('after');
  });

  it('keeps the committed value when a transition renders and suspends', async () => {
    const never = new Promise<void>(() => {
      // This transition deliberately never commits.
    });
    const attempted = jest.fn();
    let committedRef: RefObject<string> | undefined;
    function Reader({ value }: Readonly<{ value: string }>) {
      const valueRef = useLatestRef(value);
      useLayoutEffect(() => {
        committedRef = valueRef;
      }, [valueRef]);
      attempted(value);
      if (value === 'pending') throw never;
      return <span data-testid="committed-value">{value}</span>;
    }
    function App() {
      const [value, setValue] = useState('before');
      const suspend = useCallback(() => startTransition(() => setValue('pending')), []);
      return (
        <>
          <button type="button" onClick={suspend}>
            suspend
          </button>
          <Suspense fallback={null}>
            <Reader value={value} />
          </Suspense>
        </>
      );
    }
    render(<App />);
    const first = committedRef;
    expect(first?.current).toBe('before');
    attempted.mockClear();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'suspend' }));
    });

    expect(attempted).toHaveBeenCalledWith('pending');
    expect(screen.getByTestId('committed-value').textContent).toBe('before');
    expect(committedRef).toBe(first);
    expect(first?.current).toBe('before');
  });
});
