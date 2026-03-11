import { render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { GraphProvider } from '../../components';
import { PaperStoreContext } from '../../context';
import type { ReactPaper } from '../../models/react-paper';
import { useCreateReactPaper } from '../use-create-react-paper';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

function createGraphWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
      {children}
    </GraphProvider>
  );
}

interface UseCreateReactPaperHostProps {
  readonly onReady?: (paper: ReactPaper) => void;
  readonly shouldUseElementRef?: boolean;
}

function UseCreateReactPaperHost({
  onReady,
  shouldUseElementRef = true,
}: Readonly<UseCreateReactPaperHostProps>) {
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paperStore, isReady, content } = useCreateReactPaper({
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

interface UseCreateReactPaperNoSizeHostProps {
  readonly onPaperChange: (paper: ReactPaper) => void;
}

function UseCreateReactPaperNoSizeHost({
  onPaperChange,
}: Readonly<UseCreateReactPaperNoSizeHostProps>) {
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paperRef, paperStore, isReady, content } = useCreateReactPaper({
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

interface UseCreateReactPaperSingleSizeHostProps {
  readonly onPaperChange: (paper: ReactPaper) => void;
  readonly width?: number;
  readonly height?: number;
  readonly id: string;
}

function UseCreateReactPaperSingleSizeHost({
  onPaperChange,
  width,
  height,
  id,
}: Readonly<UseCreateReactPaperSingleSizeHostProps>) {
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const { paperRef, paperStore, isReady, content } = useCreateReactPaper({
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

describe('use-create-react-paper', () => {
  it('uses the elementRef host as the paper element when onReady is provided', async () => {
    const onReady = jest.fn((_paper: ReactPaper) => {});
    const wrapper = createGraphWrapper();

    render(<UseCreateReactPaperHost onReady={onReady} />, { wrapper });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      const [paper] = onReady.mock.calls.at(-1) as [ReactPaper];
      const host = screen.getByTestId('hook-paper-host');
      expect(paper.el).toBe(host);
      expect(host.classList.contains('joint-paper')).toBe(true);
    });
  });

  it('does not auto-render without elementRef', async () => {
    const wrapper = createGraphWrapper();

    render(<UseCreateReactPaperHost shouldUseElementRef={false} />, { wrapper });

    await waitFor(() => {
      const host = screen.getByTestId('hook-paper-host');
      expect(host.classList.contains('joint-paper')).toBe(false);
      expect(host.querySelector('.joint-paper')).toBeNull();
    });
  });

  it('allows custom onReady to mount paper manually when elementRef is omitted', async () => {
    const externalHost = document.createElement('div');
    document.body.append(externalHost);
    const onReady = jest.fn((paper: ReactPaper) => {
      paper.setElement(externalHost);
      paper.render();
      paper.unfreeze();
    });
    const wrapper = createGraphWrapper();

    render(<UseCreateReactPaperHost onReady={onReady} shouldUseElementRef={false} />, { wrapper });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(externalHost.querySelector('svg')).not.toBeNull();
    });
    externalHost.remove();
  });

  it('uses JointJS default dimensions when width/height options are omitted', async () => {
    const onPaperChange = jest.fn((_paper: ReactPaper) => {});
    const wrapper = createGraphWrapper();

    render(<UseCreateReactPaperNoSizeHost onPaperChange={onPaperChange} />, { wrapper });

    await waitFor(() => {
      expect(onPaperChange).toHaveBeenCalled();
    });

    const [paper] = onPaperChange.mock.calls.at(-1) as [ReactPaper];
    expect(paper.options.width).toBe(800);
    expect(paper.options.height).toBe(600);
  });

  it('leaves width undefined when only height is provided', async () => {
    const onPaperChange = jest.fn((_paper: ReactPaper) => {});
    const wrapper = createGraphWrapper();

    render(
      <UseCreateReactPaperSingleSizeHost
        id="paper-height-only-under-test"
        height={280}
        onPaperChange={onPaperChange}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(onPaperChange).toHaveBeenCalled();
    });

    const [paper] = onPaperChange.mock.calls.at(-1) as [ReactPaper];
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
      const onPaperChange = jest.fn((_paper: ReactPaper) => {});
      const wrapper = createGraphWrapper();

      render(<UseCreateReactPaperNoSizeHost onPaperChange={onPaperChange} />, { wrapper });

      await waitFor(() => {
        expect(onPaperChange).toHaveBeenCalled();
      });

      const [paper] = onPaperChange.mock.calls.at(-1) as [ReactPaper];
      expect(paper.options.width).toBe(800);
      expect(paper.options.height).toBe(600);
    } finally {
      widthGetterSpy.mockRestore();
      heightGetterSpy.mockRestore();
    }
  });

  it('leaves height undefined when only width is provided', async () => {
    const onPaperChange = jest.fn((_paper: ReactPaper) => {});
    const wrapper = createGraphWrapper();

    render(
      <UseCreateReactPaperSingleSizeHost
        id="paper-width-only-under-test"
        width={640}
        onPaperChange={onPaperChange}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(onPaperChange).toHaveBeenCalled();
    });

    const [paper] = onPaperChange.mock.calls.at(-1) as [ReactPaper];
    expect(paper.options.width).toBe(640);
    expect(paper.options.height).toBeUndefined();
  });
});
