import { type DependencyList } from 'react';
import type { GraphMappings } from '../state/data-mapping';
import type { FlatElementData } from '../types/data-types';
import type { CellId } from '../types/cell-id';
import { useFlatElementData } from './use-flat-element-data';

/**
 * @deprecated Use `useFlatElementData` instead.
 */
export function useElementMapper<T extends FlatElementData = FlatElementData>(
    options: {
        defaults?: Partial<FlatElementData> | ((data: T, id: CellId) => Partial<FlatElementData>);
        pick?: (keyof T)[];
    } = {},
    deps?: DependencyList,
): Pick<GraphMappings<T>, 'mapDataToElementAttributes' | 'mapElementAttributesToData'> {
    return useFlatElementData<T>(options, deps);
}
