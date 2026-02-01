/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  GraphProvider,
  Paper,
  useCellActions,
  type GraphElement,
  type GraphLink,
} from '../../../index';
import { useCallback } from 'react';

interface TestElement extends GraphElement {
  label: string;
}

const elements: Record<string, TestElement> = {
  '1': { label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  '2': { label: 'World', x: 100, y: 200, width: 100, height: 50 },
};

const links: Record<string, GraphLink> = {
  'link-1': {
    source: '1',
    target: '2',
  },
};

describe('Paper with useHTMLOverlay and links', () => {
  it('renders links when useHTMLOverlay is enabled', async () => {
    const { container } = render(
      <GraphProvider elements={elements} links={links}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="html-node">{label}</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      // Elements should be rendered
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
    });

    await waitFor(() => {
      // ReactLink has empty markup (no SVG content), so we just check that
      // the link view container exists in the DOM
      // The link view is added by JointJS but ReactLink doesn't render SVG paths
      const linkView = container.querySelector('.joint-type-reactlink');
      expect(linkView).toBeInTheDocument();
    });

    // Also verify initial links have valid paths
    await waitFor(
      () => {
        const linkPath = container.querySelector('.joint-link path[joint-selector="line"]');
        expect(linkPath).toBeInTheDocument();
        const pathD = linkPath?.getAttribute('d');
        expect(pathD).toBeTruthy();
        expect(pathD?.startsWith('M')).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it('renders placeholder rect in SVG element when useHTMLOverlay is enabled', async () => {
    const { container } = render(
      <GraphProvider elements={elements} links={links}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="html-node">{label}</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    await waitFor(() => {
      // Each ReactElement should have a placeholder rect
      const reactElements = container.querySelectorAll('.joint-type-reactelement');
      expect(reactElements.length).toBe(2);

      for (const element of reactElements) {
        const placeholderRect = element.querySelector('rect');
        expect(placeholderRect).toBeInTheDocument();
        // Placeholder should have width and height attributes
        expect(placeholderRect?.getAttribute('width')).toBeTruthy();
        expect(placeholderRect?.getAttribute('height')).toBeTruthy();
      }
    });
  });

  it('renders link with valid path when adding a new link dynamically via useCellActions', async () => {
    let setLinkAction: (() => void) | null = null;

    function AddLinkButton() {
      const { set } = useCellActions();
      setLinkAction = useCallback(() => {
        set('new-link', {
          source: '1',
          target: '2',
          attrs: {
            line: { stroke: '#FF0000' },
          },
        });
      }, [set]);
      return null;
    }

    const initialElements: Record<string, TestElement> = {
      '1': { label: 'Element1', x: 100, y: 0, width: 100, height: 50 },
      '2': { label: 'Element2', x: 100, y: 200, width: 100, height: 50 },
    };

    const { container } = render(
      <GraphProvider elements={initialElements}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="html-node">{label}</div>}
        />
        <AddLinkButton />
      </GraphProvider>
    );

    // Wait for elements to render
    await waitFor(() => {
      expect(screen.getByText('Element1')).toBeInTheDocument();
      expect(screen.getByText('Element2')).toBeInTheDocument();
    });

    // Initially there should be no links
    await waitFor(() => {
      const linkViews = container.querySelectorAll('.joint-link');
      expect(linkViews.length).toBe(0);
    });

    // Add a new link dynamically
    await act(async () => {
      setLinkAction?.();
    });

    // Wait for the link to be rendered
    await waitFor(
      () => {
        const linkViews = container.querySelectorAll('.joint-link');
        expect(linkViews.length).toBe(1);
      },
      { timeout: 2000 }
    );

    // Verify the link has a valid path (not empty)
    await waitFor(
      () => {
        const linkPath = container.querySelector('.joint-link path[joint-selector="line"]');
        expect(linkPath).toBeInTheDocument();
        const pathD = linkPath?.getAttribute('d');
        // The path should have a valid d attribute (not empty or null)
        expect(pathD).toBeTruthy();
        expect(pathD?.length).toBeGreaterThan(0);
        // A valid path should start with 'M' (moveto command)
        expect(pathD?.startsWith('M')).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it('removes link correctly when using useCellActions.remove', async () => {
    let removeLinkAction: (() => void) | null = null;

    function RemoveLinkButton() {
      const { remove } = useCellActions();
      removeLinkAction = useCallback(() => {
        remove('link-1');
      }, [remove]);
      return null;
    }

    const { container } = render(
      <GraphProvider elements={elements} links={links}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="html-node">{label}</div>}
        />
        <RemoveLinkButton />
      </GraphProvider>
    );

    // Wait for elements and link to render
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      const linkViews = container.querySelectorAll('.joint-link');
      expect(linkViews.length).toBe(1);
    });

    // Remove the link
    await act(async () => {
      removeLinkAction?.();
    });

    // Wait for the link to be removed
    await waitFor(
      () => {
        const linkViews = container.querySelectorAll('.joint-link');
        expect(linkViews.length).toBe(0);
      },
      { timeout: 2000 }
    );
  });
});
