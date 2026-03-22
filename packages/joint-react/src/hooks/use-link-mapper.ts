import { type DependencyList } from 'react';
import type { GraphMappings } from '../state/data-mapping';
import type { FlatLinkData } from '../types/data-types';
import type { CellId } from '../types/cell-id';
import { useFlatLinkData } from './use-flat-link-data';

/**
 * @deprecated Use `useFlatLinkData` instead.
 */
export function useLinkMapper<T extends FlatLinkData = FlatLinkData>(
    options: {
        defaults?: Partial<FlatLinkData> | ((data: T, id: CellId) => Partial<FlatLinkData>);
        pick?: (keyof T)[];
    } = {},
    deps?: DependencyList,
): Pick<GraphMappings<unknown, T>, 'mapDataToLinkAttributes' | 'mapLinkAttributesToData'> {
    return useFlatLinkData<T>(options, deps);
}
