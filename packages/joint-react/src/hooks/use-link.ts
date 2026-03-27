import { useContext } from 'react';
import { useLinkId } from './use-link-id';
import { useGraphStore } from './use-graph-store';
import { isStrictEqual, identitySelector } from '../utils/selector-utils';
import { useContainerItem } from './use-container-item';
import type { Link } from '../types/data-types';
import type { LinkLayout } from '../types/cell-data';
import { PaperStoreContext } from '../context';
import { getLinkLayout } from '../store/update-layout-state';
import type { dia } from '@joint/core';

/** Link data resolved for the current paper — `layout` is the single paper's `LinkLayout`. */
export type ResolvedLink<D extends object | undefined = undefined> = Omit<Link<D>, 'layout'> & {
  layout: LinkLayout;
};

/**
 * Hook to access a specific graph link from the current Paper context.
 * Use it only inside `renderLink` or components rendered from within.
 *
 * Returns link data with the current paper's layout resolved
 * (source/target coordinates and SVG path).
 *
 * @example
 * ```tsx
 * const link = useLink();
 * const { source, target, layout } = link;
 * // layout.sourceX, layout.d, etc.
 * ```
 * @example
 * ```tsx
 * const color = useLink((l) => l.color);
 * ```
 * @param selector - Extracts part of the link. Defaults to identity.
 * @param isEqual - Equality check. Defaults to `Object.is`.
 * @returns The selected link data.
 * @group Hooks
 */
export function useLink<D extends object | undefined = undefined, R = ResolvedLink<D>>(
  selector: (item: ResolvedLink<D>) => R = identitySelector as (item: ResolvedLink<D>) => R,
  isEqual: (a: R, b: R) => boolean = isStrictEqual
): R {
  const id = useLinkId();
  const paperStore = useContext(PaperStoreContext);
  const paper = paperStore?.paper as dia.Paper | undefined;
  const {
    graphView: { links },
  } = useGraphStore<undefined, D>();

  // Wrap the user selector to resolve layout live from the paper view
  const resolvedSelector = (item: Link<D>): R => {
    // eslint-disable-next-line sonarjs/no-unused-vars
    const { ...rest } = item;

    // Read layout directly from the paper's link view — always fresh
    let paperLayout: LinkLayout | undefined;
    if (paper) {
      const linkView = paper.findViewByModel(id) as dia.LinkView | null;
      if (linkView) {
        paperLayout = getLinkLayout(linkView);
      }
    }

    const resolved = { ...rest, layout: paperLayout } as ResolvedLink<D>;
    return selector(resolved);
  };

  return useContainerItem(links, id, resolvedSelector, isEqual) as R;
}
