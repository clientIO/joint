/* eslint-disable @typescript-eslint/no-explicit-any */
import { waitFor } from '@testing-library/react';
import { createElementSizeObserver } from '../create-element-size-observer';

describe('createElementSizeObserver', () => {
  let mockElement: HTMLElement;
  let mockObserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(() => {
    // Mock element
    mockElement = document.createElement('div');
    // @ts-expect-error: Mocking getBoundingClientRect
    mockElement.getBoundingClientRect = jest.fn(() => ({
      width: 123,
      height: 456,
      // ...other properties
    }));

    // Mock ResizeObserver
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();
    originalResizeObserver = globalThis.ResizeObserver;
    (globalThis as any).ResizeObserver = jest.fn(function (cb) {
      (this as any).cb = cb;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
      };
    });
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    jest.clearAllMocks();
  });

  it('should call onResize immediately with element size', async () => {
    const onResize = jest.fn();
    createElementSizeObserver(mockElement, onResize);
    await waitFor(() => {
      expect(onResize).toHaveBeenCalledWith({ width: 123, height: 456 });
    });
  });

  it('should observe the element with border-box', () => {
    createElementSizeObserver(mockElement, jest.fn());
    expect(mockObserve).toHaveBeenCalledWith(mockElement, { box: 'border-box' });
  });

  it('should call onResize when ResizeObserver callback fires', () => {
    const onResize = jest.fn();
    createElementSizeObserver(mockElement, onResize);

    // Simulate ResizeObserver callback
    // eslint-disable-next-line prefer-destructuring
    const instance = (ResizeObserver as jest.Mock).mock.instances[0];
    const { cb } = instance;
    cb([
      {
        borderBoxSize: [{ inlineSize: 200, blockSize: 100 }],
      },
    ]);
    expect(onResize).toHaveBeenCalledWith({ width: 200, height: 100 });
  });

  it('should ignore entries with missing or empty borderBoxSize', async () => {
    const onResize = jest.fn();
    createElementSizeObserver(mockElement, onResize);

    // eslint-disable-next-line prefer-destructuring
    const instance = (ResizeObserver as jest.Mock).mock.instances[0];
    const { cb } = instance;
    cb([{ borderBoxSize: undefined }]);
    cb([{ borderBoxSize: [] }]);
    // Only the initial call should be present
    await waitFor(() => {
      expect(onResize).toHaveBeenCalledTimes(1);
    });
  });

  it('should cleanup and disconnect observer', () => {
    const cleanup = createElementSizeObserver(mockElement, jest.fn());
    cleanup();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
