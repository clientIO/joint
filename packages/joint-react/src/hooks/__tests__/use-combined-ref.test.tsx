/* eslint-disable @eslint-react/no-create-ref */
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { useCombinedRef } from '../use-combined-ref';

describe('useCombinedRef', () => {
  it('should return a ref object', () => {
    const { result } = renderHook(() => useCombinedRef<HTMLDivElement>());
    expect(result.current).toHaveProperty('current');
  });

  it('should assign the ref to a forwarded ref object', () => {
    const ref = createRef<HTMLDivElement>();
    function Test() {
      const combinedRef = useCombinedRef<HTMLDivElement>(ref);
      return <div data-testid="el" ref={combinedRef} />;
    }
    render(<Test />);
    const element = screen.getByTestId('el');
    expect(ref.current).toBe(element);
  });

  it('should call the ref callback if ref is a function', () => {
    let calledValue: HTMLDivElement | null = null;
    // eslint-disable-next-line unicorn/prevent-abbreviations
    const refFn = (el: HTMLDivElement | null) => {
      calledValue = el;
    };
    function Test() {
      const combinedRef = useCombinedRef<HTMLDivElement>(refFn);
      return <div data-testid="el" ref={combinedRef} />;
    }
    render(<Test />);
    const element = screen.getByTestId('el');
    expect(calledValue).toBe(element);
  });
});
