/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GraphProvider, Paper, useGraph, type PortalElementRecord, type PortalLinkRecord } from '../../../index';
import { useCallback } from 'react';
import { useElementData } from '../../../hooks/use-element-data';

type TestElement = PortalElementRecord<{ label: string }>;

const elements: Record<string, TestElement> = {
  '1': { data: { label: 'Hello' }, position: { x: 100, y: 0 }, size: { width: 100, height: 50 } },
  '2': { data: { label: 'World' }, position: { x: 100, y: 200 }, size: { width: 100, height: 50 } },
};

function TestElementRenderer() {
  const data = useElementData<{ label: string }>();
  return <div className="html-node">{data?.label}</div>;
}

const links: Record<string, PortalLinkRecord> = {
  'link-1': {
    data: {},
    source: { id: '1' },
    target: { id: '2' },
  },
};

describe('Paper with useHTMLOverlay and links', () => {
  it('renders links when useHTMLOverlay is enabled', async () => {
    const { container } = render(
      <GraphProvider elements={elements} links={links}>
        <Paper
          useHTMLOverlay
          renderElement={() => <TestElementRenderer />}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      // Elements should be rendered
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
    });

    await waitFor(() => {
      // PortalLink has SVG markup for the link
      // Check that the link view container exists in the DOM
      const linkView = container.querySelector('.joint-type-portallink');
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
        <Paper
          useHTMLOverlay
          renderElement={() => <TestElementRenderer />}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    await waitFor(() => {
      // Each PortalElement should have a placeholder rect
      const reactElements = container.querySelectorAll('.joint-type-portalelement');
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

  it('renders link with valid path when adding a new link dynamically via useGraph', async () => {
    let setLinkAction: (() => void) | null = null;

    function AddLinkButton() {
      const { setLink } = useGraph();
      setLinkAction = useCallback(() => {
        setLink('new-link', {
          source: '1',
          target: '2',
          color: '#FF0000',
        });
      }, [setLink]);
      return null;
    }

    const initialElements: Record<string, TestElement> = {
      '1': { data: { label: 'Element1' }, position: { x: 100, y: 0 }, size: { width: 100, height: 50 } },
      '2': { data: { label: 'Element2' }, position: { x: 100, y: 200 }, size: { width: 100, height: 50 } },
    };

    const { container } = render(
      <GraphProvider elements={initialElements}>
        <Paper
          useHTMLOverlay
          renderElement={() => <TestElementRenderer />}
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

  it('removes link correctly when using useGraph.removeLink', async () => {
    let removeLinkAction: (() => void) | null = null;

    function RemoveLinkButton() {
      const { removeLink } = useGraph();
      removeLinkAction = useCallback(() => {
        removeLink('link-1');
      }, [removeLink]);
      return null;
    }

    const { container } = render(
      <GraphProvider elements={elements} links={links}>
        <Paper
          useHTMLOverlay
          renderElement={() => <TestElementRenderer />}
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
