import { dia } from '@joint/core';
import { measureNode } from './measure-node';
import { linkRoutingStraight } from './link-routing';
import { LinkView } from './link-view';

// Inject CSS custom property into all built-in grid pattern colors
// so they respond to --jj-paper-grid-color.
// @ts-expect-error Accessing protected member to set default grid pattern colors
// eslint-disable-next-line unicorn/no-array-for-each
Object.values(dia.Paper.gridPatterns).forEach((pattern) => {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  for (const subPattern of patterns) {
    if (!subPattern.color) continue;
    subPattern.color = 'var(--jj-paper-grid-color)';
  }
});

const DEFAULT_CLICK_THRESHOLD = 5;
const DEFAULT_GRID_SIZE = 10;
const DEFAULT_SNAP_RADIUS = 15;

// Future improvement: this should sit on the dia.Paper prototype,
// so it can be overridden by inheriting classes (e.g. Paper)
export const DEFAULT_HIGHLIGHTING = {
  [dia.CellView.Highlighting.DEFAULT]: {
    name: 'stroke',
    options: {
      attrs: {
        strokeWidth: 2,
        stroke: 'var(--jj-paper-highlight-color)',
      },
      rx: 4,
      ry: 4,
      padding: 6,
    },
  },
  [dia.CellView.Highlighting.MAGNET_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: 'jj-is-available',
    },
  },
  [dia.CellView.Highlighting.ELEMENT_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: 'jj-is-available',
    },
  },
};

const linkView = (
  _: dia.Link,
  NSViewCtor: typeof dia.LinkView | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): typeof dia.LinkView<any> => {
  // Use the namespaced LinkView if provided,
  // otherwise fall back to the default LinkView.
  return NSViewCtor ?? LinkView;
};

export const Paper = dia.Paper.extend({
  options: {
    ...dia.Paper.prototype.options,
    // Required for React integration features:
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    frozen: true,
    autoFreeze: true,
    viewManagement: {
      disposeHidden: true,
      lazyInitialize: true,
    },
    // Defaults (overridable from constructor options)
    preventDefaultBlankAction: false,
    linkPinning: false,
    gridSize: DEFAULT_GRID_SIZE,
    markAvailable: true,
    clickThreshold: DEFAULT_CLICK_THRESHOLD,
    snapLinks: { radius: DEFAULT_SNAP_RADIUS },
    highlighting: DEFAULT_HIGHLIGHTING,
    drawGrid: true,
    magnetThreshold: 'onleave',
    ...linkRoutingStraight(),
    measureNode,
    linkView,
  },

  _ensureElClassName() {
    // Note: the `className` property is ignored here.
    this.el.classList.add('jj-paper', 'joint-paper');
  },
}) as typeof dia.Paper;
