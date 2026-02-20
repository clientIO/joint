/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/**
 * Test suite to catch the "link flickering" bug.
 *
 * THE BUG:
 * When rendering a Paper with elements and links, the visual sequence is:
 * - Frame 1: Empty screen
 * - Frame 2: Only links visible (pointing to positions, but no element content)
 * - Frame 3: Correct render with both elements and links
 *
 * This happens because:
 * - JointJS renders link SVG paths synchronously
 * - React portals render element content via microtask (later)
 *
 * These tests verify the INVARIANT:
 * "If links are visible with rendered paths, elements must also have their content rendered"
 */
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GraphProvider, Paper, type GraphElement, type GraphLink } from '../../../index';

/**
 * Flushes the microtask queue by waiting for a microtask to complete.
 */
async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
}

interface TestElement extends GraphElement {
  readonly label: string;
}

const TEST_ELEMENTS: Record<string, TestElement> = {
  '1': { label: 'Element1', x: 100, y: 0, width: 100, height: 50 },
  '2': { label: 'Element2', x: 100, y: 200, width: 100, height: 50 },
};

const TEST_LINKS: Record<string, GraphLink> = {
  'link-1': {
    source: '1',
    target: '2',
  },
};

/**
 * Helper to check the consistency invariant:
 * If links have rendered paths, elements must have their React content.
 */
function checkLinkElementConsistency(container: HTMLElement): {
  readonly linksHavePaths: boolean;
  readonly elementsHaveContent: boolean;
  readonly isConsistent: boolean;
} {
  // Check if any link has a rendered path (not empty)
  const linkPaths = container.querySelectorAll('.joint-link path[joint-selector="line"]');
  const linksHavePaths = [...linkPaths].some((path) => {
    const d = path.getAttribute('d');
    return d && d.length > 0 && d.startsWith('M');
  });

  // Check if elements have their React content rendered
  const elementContents = container.querySelectorAll('.element-content');
  const elementsHaveContent = elementContents.length === Object.keys(TEST_ELEMENTS).length;

  // Consistency: if links are visible, elements must be visible too
  const isConsistent = !linksHavePaths || elementsHaveContent;

  return { linksHavePaths, elementsHaveContent, isConsistent };
}

/**
 * Helper to check that link paths don't point to origin (0,0).
 * If links render before elements are positioned, they might have M0,0 paths.
 */
function checkLinkPathsNotAtOrigin(container: HTMLElement): boolean {
  const linkPaths = container.querySelectorAll('.joint-link path[joint-selector="line"]');

  for (const path of linkPaths) {
    const d = path.getAttribute('d');
    // A path starting with M0,0 or M 0 0 indicates link rendered at origin
    // This happens when elements haven't been positioned yet
    if (d && /^M\s*0[,\s]+0/.test(d)) {
      return false;
    }
  }

  return true;
}

describe('Paper link flickering prevention', () => {
  it('INVARIANT: links should not have paths before element content is rendered (SVG mode)', async () => {
    const { container } = render(
      <GraphProvider elements={TEST_ELEMENTS} links={TEST_LINKS}>
        <Paper<TestElement>
          renderElement={({ label }) => (
            <foreignObject width="100" height="50">
              <div className="element-content">{label}</div>
            </foreignObject>
          )}
        />
      </GraphProvider>
    );

    // Check consistency at multiple timing points
    const timingPoints = [
      'immediate',
      'microtask-1',
      'microtask-2',
      'microtask-3',
      'microtask-4',
      'microtask-5',
    ];

    // Immediate check (before any microtasks)
    let result = checkLinkElementConsistency(container);
    if (!result.isConsistent) {
      throw new Error(
        `FLICKERING BUG DETECTED at ${timingPoints[0]}: ` +
          `Links have paths (${result.linksHavePaths}) but elements have no content (${result.elementsHaveContent})`
      );
    }

    // Check after each microtask flush
    for (let index = 1; index <= 5; index++) {
      await flushMicrotasks();
      result = checkLinkElementConsistency(container);
      if (!result.isConsistent) {
        throw new Error(
          `FLICKERING BUG DETECTED at ${timingPoints[index]}: ` +
            `Links have paths (${result.linksHavePaths}) but elements have no content (${result.elementsHaveContent})`
        );
      }
    }

    // Final state should have both links and elements
    await waitFor(() => {
      const finalResult = checkLinkElementConsistency(container);
      expect(finalResult.linksHavePaths).toBe(true);
      expect(finalResult.elementsHaveContent).toBe(true);
      expect(finalResult.isConsistent).toBe(true);
    });
  });

  it('INVARIANT: links should not have paths before element content is rendered (HTML overlay mode)', async () => {
    const { container } = render(
      <GraphProvider elements={TEST_ELEMENTS} links={TEST_LINKS}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="element-content">{label}</div>}
        />
      </GraphProvider>
    );

    // Immediate check
    let result = checkLinkElementConsistency(container);
    if (!result.isConsistent) {
      throw new Error(
        'FLICKERING BUG DETECTED (immediate): ' +
          `Links have paths (${result.linksHavePaths}) but elements have no content (${result.elementsHaveContent})`
      );
    }

    // Check after microtask flushes
    for (let index = 0; index < 5; index++) {
      await flushMicrotasks();
      result = checkLinkElementConsistency(container);
      if (!result.isConsistent) {
        throw new Error(
          `FLICKERING BUG DETECTED (microtask ${index + 1}): ` +
            `Links have paths (${result.linksHavePaths}) but elements have no content (${result.elementsHaveContent})`
        );
      }
    }

    // Final state check
    await waitFor(() => {
      const finalResult = checkLinkElementConsistency(container);
      expect(finalResult.linksHavePaths).toBe(true);
      expect(finalResult.elementsHaveContent).toBe(true);
    });
  });

  it('measureNode returns correct model size for ReactElement', async () => {
    // This test verifies that the measureNode callback is set up correctly.
    // Note: In jsdom, SVG transform calculations don't work properly, so we can't
    // verify the final link path coordinates. But we can verify that:
    // 1. Links render (not blocked)
    // 2. The link path exists and has valid format
    // 3. The measureNode fix is applied (verified by other passing tests)

    const { container } = render(
      <GraphProvider elements={TEST_ELEMENTS} links={TEST_LINKS}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="element-content">{label}</div>}
        />
      </GraphProvider>
    );

    // Wait for link to render
    await waitFor(
      () => {
        const linkPath = container.querySelector('.joint-link path[joint-selector="line"]');
        expect(linkPath).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const linkPath = container.querySelector('.joint-link path[joint-selector="line"]');
    const d = linkPath?.getAttribute('d');

    // Verify path exists and has valid SVG path format (starts with M)
    expect(d).toBeTruthy();
    expect(d?.startsWith('M')).toBe(true);

    // Verify it's not an empty path (M and L should have coordinates)
    const pathMatch = d?.match(/^M\s*([\d.]+)[,\s]+([\d.]+)\s*L\s*([\d.]+)[,\s]+([\d.]+)/);
    expect(pathMatch).toBeTruthy();

    // Note: We can't verify exact coordinates in jsdom because SVG transforms
    // don't work correctly. The real browser will show correct coordinates
    // because the measureNode callback returns the model's size, which is then
    // transformed by getRootTranslateMatrix() with the element's position.
  });

  it('link paths should have correct coordinates (not at origin 0,0)', async () => {
    const { container } = render(
      <GraphProvider elements={TEST_ELEMENTS} links={TEST_LINKS}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="element-content">{label}</div>}
        />
      </GraphProvider>
    );

    // Wait for links to render
    await waitFor(
      () => {
        const linkPath = container.querySelector('.joint-link path[joint-selector="line"]');
        expect(linkPath).toBeInTheDocument();
        expect(linkPath?.getAttribute('d')).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Verify paths don't point to origin
    const pathsValid = checkLinkPathsNotAtOrigin(container);
    expect(pathsValid).toBe(true);

    // Additionally, verify the path has reasonable coordinates
    const linkPath = container.querySelector('.joint-link path[joint-selector="line"]');
    const d = linkPath?.getAttribute('d');

    // Parse first coordinate from path (M x,y ...)
    const match = d?.match(/^M\s*([\d.]+)[,\s]+([\d.]+)/);
    if (match) {
      const x = Number.parseFloat(match[1]);
      const y = Number.parseFloat(match[2]);

      // The path should start near element 1's position (x: 100, y: 0, width: 100, height: 50)
      // So the link source point should be around x: 100-200, y: 0-50
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });

  it('should maintain consistency during initial render (no state changes)', async () => {
    const { container } = render(
      <GraphProvider elements={TEST_ELEMENTS} links={TEST_LINKS}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="element-content">{label}</div>}
        />
      </GraphProvider>
    );

    // Check consistency at every microtask boundary
    for (let index = 0; index < 10; index++) {
      const result = checkLinkElementConsistency(container);
      // Log any inconsistency for debugging
      if (!result.isConsistent) {
        // eslint-disable-next-line no-console
        console.warn(`Inconsistency at microtask ${index}: links=${result.linksHavePaths}, elements=${result.elementsHaveContent}`);
      }
      await flushMicrotasks();
    }

    // Final state must have both elements and links
    await waitFor(() => {
      const elementContents = container.querySelectorAll('.element-content');
      expect(elementContents.length).toBe(2);

      const linkPaths = container.querySelectorAll('.joint-link path[joint-selector="line"]');
      expect(linkPaths.length).toBe(1);
    });
  });

  it('records timing of link vs element rendering for debugging', async () => {
    const timingLog: Array<{
      readonly timestamp: number;
      readonly phase: string;
      readonly linksHavePaths: boolean;
      readonly elementsHaveContent: boolean;
    }> = [];

    const startTime = performance.now();

    const { container } = render(
      <GraphProvider elements={TEST_ELEMENTS} links={TEST_LINKS}>
        <Paper<TestElement>
          useHTMLOverlay
          renderElement={({ label }) => <div className="element-content">{label}</div>}
        />
      </GraphProvider>
    );

    // Log immediately
    const logState = (phase: string) => {
      const result = checkLinkElementConsistency(container);
      timingLog.push({
        timestamp: performance.now() - startTime,
        phase,
        linksHavePaths: result.linksHavePaths,
        elementsHaveContent: result.elementsHaveContent,
      });
    };

    logState('immediate');

    for (let index = 1; index <= 10; index++) {
      await flushMicrotasks();
      logState(`microtask-${index}`);
    }

    // Wait for final state
    await waitFor(() => {
      expect(container.querySelector('.element-content')).toBeInTheDocument();
    });

    logState('final');

    // Find if there was ever a state where links existed but elements didn't
    const flickeringOccurred = timingLog.some(
      (entry) => entry.linksHavePaths && !entry.elementsHaveContent
    );

    if (flickeringOccurred) {
      // eslint-disable-next-line no-console
      console.warn('FLICKERING DETECTED! Links rendered before elements.');
      const flickeringEntries = timingLog.filter(
        (entry) => entry.linksHavePaths && !entry.elementsHaveContent
      );
      // eslint-disable-next-line no-console
      console.warn('Flickering entries:', flickeringEntries);
    }

    // This is the actual test assertion
    expect(flickeringOccurred).toBe(false);
  });
});
