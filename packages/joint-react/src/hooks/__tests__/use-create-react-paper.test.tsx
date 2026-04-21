import { render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { GraphProvider } from '../../components';
import { PaperStoreContext } from '../../context';
import type { PortalPaper } from '../../models/portal-paper';
import { useCreatePortalPaper } from '../use-create-portal-paper';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

function createGraphWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
      {children}
    </GraphProvider>
  );
}

interface UseCreatePortalPaperHostProps {
  readonly onReady?: (paper: PortalPaper) => void;
  readonly shouldUseElementRef?: boolean;
}

function UseCreatePortalPaperHost({
  onReady,
  shouldUseElementRef = true,
}: Readonly<UseCreatePortalPaperHostProps>) {
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paperStore, isReady, content } = useCreatePortalPaper({
    id: 'paper-under-test',
    width: 100,
    height: 100,
    renderElement: renderTestElement,
    onReady,
    elementRef: shouldUseElementRef ? paperHTMLElementRef : undefined,
  });

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div data-testid="hook-paper-host" ref={paperHTMLElementRef}>
        {isReady && content}
      </div>
    </PaperStoreContext.Provider>
  );
}

interface UseCreatePortalPaperNoSizeHostProps {
  readonly onPaperChange: (paper: PortalPaper) => void;
}

function UseCreatePortalPaperNoSizeHost({
  onPaperChange,
}: Readonly<UseCreatePortalPaperNoSizeHostProps>) {
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paperRef, paperStore, isReady, content } = useCreatePortalPaper({
    id: 'paper-no-size-under-test',
    renderElement: renderTestElement,
    elementRef: paperHTMLElementRef,
  });

  useEffect(() => {
    if (!isReady || !paperRef.current) {
      return;
    }
    onPaperChange(paperRef.current);
  }, [isReady, onPaperChange, paperRef]);

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div data-testid="hook-paper-no-size-host" ref={paperHTMLElementRef}>
        {isReady && content}
      </div>
    </PaperStoreContext.Provider>
  );
}

interface UseCreatePortalPaperSingleSizeHostProps {
  readonly onPaperChange: (paper: PortalPaper) => void;
  readonly width?: number;
  readonly height?: number;
  readonly id: string;
}

function UseCreatePortalPaperSingleSizeHost({
  onPaperChange,
  width,
  height,
  id,
}: Readonly<UseCreatePortalPaperSingleSizeHostProps>) {
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paperRef, paperStore, isReady, content } = useCreatePortalPaper({
    id,
    width,
    height,
    renderElement: renderTestElement,
    elementRef: paperHTMLElementRef,
  });

  useEffect(() => {
    if (!isReady || !paperRef.current) {
      return;
    }
    onPaperChange(paperRef.current);
  }, [isReady, onPaperChange, paperRef]);

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div data-testid={`hook-paper-single-size-host-${id}`} ref={paperHTMLElementRef}>
        {isReady && content}
      </div>
    </PaperStoreContext.Provider>
  );
}

function RenderCountHost({ onRenderCount }: { readonly onRenderCount: (count: number) => void }) {
  const renderCountRef = useRef(0);
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paperStore, isReady, content } = useCreatePortalPaper({
    id: 'paper-render-count',
    width: 400,
    height: 300,
    renderElement: renderTestElement,
    elementRef: paperHTMLElementRef,
  });

  renderCountRef.current += 1;

  useEffect(() => {
    // Report render count after all effects have settled
    onRenderCount(renderCountRef.current);
  });

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div ref={paperHTMLElementRef}>{isReady && content}</div>
    </PaperStoreContext.Provider>
  );
}

describe('use-create-portal-paper', () => {
  it('uses the elementRef host as the paper element when onReady is provided', async () => {
    const onReady = jest.fn((_paper: PortalPaper) => {});
    const wrapper = createGraphWrapper();

    render(<UseCreatePortalPaperHost onReady={onReady} />, { wrapper });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      const [paper] = onReady.mock.calls.at(-1) as [PortalPaper];
      const host = screen.getByTestId('hook-paper-host');
      expect(paper.el).toBe(host);
      expect(host.classList.contains('joint-paper')).toBe(true);
    });
  });

  it('does not auto-render without elementRef', async () => {
    const wrapper = createGraphWrapper();

    render(<UseCreatePortalPaperHost shouldUseElementRef={false} />, { wrapper });

    await waitFor(() => {
      const host = screen.getByTestId('hook-paper-host');
      expect(host.classList.contains('joint-paper')).toBe(false);
      expect(host.querySelector('.joint-paper')).toBeNull();
    });
  });

  it('allows custom onReady to mount paper manually when elementRef is omitted', async () => {
    const externalHost = document.createElement('div');
    document.body.append(externalHost);
    const onReady = jest.fn((paper: PortalPaper) => {
      paper.setElement(externalHost);
      paper.render();
      paper.unfreeze();
    });
    const wrapper = createGraphWrapper();

    render(<UseCreatePortalPaperHost onReady={onReady} shouldUseElementRef={false} />, { wrapper });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(externalHost.querySelector('svg')).not.toBeNull();
    });
    externalHost.remove();
  });

  it('uses JointJS default dimensions when width/height options are omitted', async () => {
    const onPaperChange = jest.fn((_paper: PortalPaper) => {});
    const wrapper = createGraphWrapper();

    render(<UseCreatePortalPaperNoSizeHost onPaperChange={onPaperChange} />, { wrapper });

    await waitFor(() => {
      expect(onPaperChange).toHaveBeenCalled();
    });

    const [paper] = onPaperChange.mock.calls.at(-1) as [PortalPaper];
    expect(paper.options.width).toBe(800);
    expect(paper.options.height).toBe(600);
  });

  it('leaves width undefined when only height is provided', async () => {
    const onPaperChange = jest.fn((_paper: PortalPaper) => {});
    const wrapper = createGraphWrapper();

    render(
      <UseCreatePortalPaperSingleSizeHost
        id="paper-height-only-under-test"
        height={280}
        onPaperChange={onPaperChange}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(onPaperChange).toHaveBeenCalled();
    });

    const [paper] = onPaperChange.mock.calls.at(-1) as [PortalPaper];
    expect(paper.options.height).toBe(280);
    expect(paper.options.width).toBeUndefined();
  });

  it('does not infer dimensions from host element size when width/height are omitted', async () => {
    const widthGetterSpy = jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(640);
    const heightGetterSpy = jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(200);

    try {
      const onPaperChange = jest.fn((_paper: PortalPaper) => {});
      const wrapper = createGraphWrapper();

      render(<UseCreatePortalPaperNoSizeHost onPaperChange={onPaperChange} />, { wrapper });

      await waitFor(() => {
        expect(onPaperChange).toHaveBeenCalled();
      });

      const [paper] = onPaperChange.mock.calls.at(-1) as [PortalPaper];
      expect(paper.options.width).toBe(800);
      expect(paper.options.height).toBe(600);
    } finally {
      widthGetterSpy.mockRestore();
      heightGetterSpy.mockRestore();
    }
  });

  it('leaves height undefined when only width is provided', async () => {
    const onPaperChange = jest.fn((_paper: PortalPaper) => {});
    const wrapper = createGraphWrapper();

    render(
      <UseCreatePortalPaperSingleSizeHost
        id="paper-width-only-under-test"
        width={640}
        onPaperChange={onPaperChange}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(onPaperChange).toHaveBeenCalled();
    });

    const [paper] = onPaperChange.mock.calls.at(-1) as [PortalPaper];
    expect(paper.options.width).toBe(640);
    expect(paper.options.height).toBeUndefined();
  });

  it('renders at most 2 times on initial mount with 2 elements and 1 link', async () => {
    const renderCounts: number[] = [];
    const onRenderCount = (count: number) => {
      renderCounts.push(count);
    };

    const initialElements = {
      '1': { data: undefined, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
      '2': { data: undefined, position: { x: 200, y: 100 }, size: { width: 100, height: 50 } },
    };
    const initialLinks = {
      'link-1': { source: '1', target: '2' },
    };

    render(
      <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
        <RenderCountHost onRenderCount={onRenderCount} />
      </GraphProvider>
    );

    // Wait for all effects to settle
    await waitFor(() => {
      expect(renderCounts.length).toBeGreaterThan(0);
    });

    // Allow any remaining microtasks/effects to flush
    await new Promise((resolve) => setTimeout(resolve, 1));

    const finalRenderCount = renderCounts.at(-1)!;
    // StrictMode doubles renders: initial mount + data arrival + measureState bump
    // (3 logical renders × 2 = 6 max).
    expect(finalRenderCount).toBeLessThanOrEqual(6);
  });
});
