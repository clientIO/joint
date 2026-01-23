/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GraphProvider, Paper, type GraphElement, type GraphLink } from '../../../index';

interface TestElement extends GraphElement {
  label: string;
}

const elements: TestElement[] = [
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
];

const links: GraphLink[] = [
  {
    id: 'link-1',
    source: '1',
    target: '2',
  },
];

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
      // The link should be present with a path element
      const linkPath = container.querySelector('.joint-type-reactlink path[joint-selector="line"]');
      expect(linkPath).toBeInTheDocument();

      const d = linkPath?.getAttribute('d');
      // Link should have a path (jsdom may not fully compute SVG geometry,
      // so we just verify the path exists and isn't completely empty)
      expect(d).toBeTruthy();
    });
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
});
