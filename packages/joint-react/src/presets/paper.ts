import { dia } from '@joint/core';
import { measureNode } from './measure-node';
import { linkRoutingStraight } from './link-routing';
import { LinkView } from './link-view';

// Inject CSS custom property into all built-in grid pattern colors
// so they respond to --jr-paper-grid-color.
// @ts-expect-error Accessing protected member to set default grid pattern colors
// eslint-disable-next-line unicorn/no-array-for-each
Object.values(dia.Paper.gridPatterns).forEach((pattern) => {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  for (const subPattern of patterns) {
    if (!subPattern.color) continue;
    // @todo read the fallback color from js theme.
    subPattern.color = 'var(--jr-paper-grid-color, #9298a5)';
  }
});

const DEFAULT_CLICK_THRESHOLD = 5;
const DEFAULT_GRID_SIZE = 10;
const DEFAULT_SNAP_RADIUS = 15;

// @todo - this should sit on the dia.Paper prototype,
// so it can be overridden by inheriting classes (e.g. Paper)
export const DEFAULT_HIGHLIGHTING = {
  [dia.CellView.Highlighting.DEFAULT]: {
    name: 'stroke',
    options: {
      attrs: {
        strokeWidth: 2,
        // @todo read the fallback color from js theme.
        stroke: 'var(--jr-paper-highlight-color, #ff4081)',
      },
      rx: 4,
      ry: 4,
      padding: 6,
    },
  },
  [dia.CellView.Highlighting.MAGNET_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: 'jr-available-magnet',
    },
  },
  [dia.CellView.Highlighting.ELEMENT_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: 'jr-available-element',
    },
  },
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
    drawGrid: true,
    ...linkRoutingStraight(),
    measureNode: measureNode as dia.Paper.Options['measureNode'],
    highlighting: DEFAULT_HIGHLIGHTING,
    linkView: (_link: dia.Link, NSViewCtor: typeof dia.LinkView | undefined) => NSViewCtor ?? LinkView,
  },

  _ensureElClassName() {
    // Note: the `className` property is ignored here.
    this.el.classList.add('jr-paper', 'joint-paper');
  }

}) as typeof dia.Paper;
