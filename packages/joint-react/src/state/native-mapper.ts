import { type dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import { getTargetOrSource } from '../utils/cell/get-link-targe-and-source-ids';
import { REACT_TYPE } from '../models/react-element';
import type {
    ElementToGraphOptions,
    GraphToElementOptions,
    LinkToGraphOptions,
    GraphToLinkOptions,
    MapperPreset,
} from './graph-state-selectors';

/** Keys excluded from reverse mapping (managed by the framework). */
const INTERNAL_KEYS = new Set(['id']);

/**
 * Applies shape preservation by filtering cellData to only include keys from previous data state.
 */
function applyShapePreservation<T extends GraphElement | GraphLink>(
    cellData: Record<string, unknown>,
    previousData: T
): T {
    const filtered: Record<string, unknown> = {};
    const previousRecord = previousData as Record<string, unknown>;
    for (const key in previousRecord) {
        if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
            filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
        }
    }
    return filtered as T;
}

/**
 * Maps element data directly to JointJS cell attributes.
 *
 * All data properties become cell attributes (no `cell.data` indirection).
 * Accepts flat `x,y,width,height` for convenience — converts to `position`/`size`.
 * Type defaults to `REACT_TYPE` unless provided in data.
 */
function mapDataToElementAttributes<Element extends GraphElement>(
    options: ElementToGraphOptions<Element>
): dia.Cell.JSON {
    const { id, data } = options;
    const record = data as Record<string, unknown>;
    const { x, y, width, height, type, ...rest } = record;

    const attributes: dia.Cell.JSON = {
        ...rest,
        id,
        type: typeof type === 'string' ? type : REACT_TYPE,
    };

    // Convenience: flat x/y/width/height → position/size (only if nested not already provided)
    if (!('position' in rest) && typeof x === 'number' && typeof y === 'number') {
        attributes.position = { x, y };
    }
    if (!('size' in rest) && typeof width === 'number' && typeof height === 'number') {
        attributes.size = { width, height };
    }

    return attributes;
}

/**
 * Maps JointJS element attributes directly back to data.
 *
 * Returns all cell attributes except `id`. Data shape mirrors cell JSON.
 * Shape preservation via `previousData`.
 */
function mapElementAttributesToData<Element extends GraphElement>(
    options: GraphToElementOptions<Element>
): Element {
    const { cell, previousData } = options;

    const cellData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(cell.attributes)) {
        if (!INTERNAL_KEYS.has(key)) {
            cellData[key] = value;
        }
    }

    if (previousData !== undefined) {
        return applyShapePreservation(cellData, previousData);
    }

    return cellData as Element;
}

/**
 * Maps link data directly to JointJS cell attributes.
 *
 * All data properties become cell attributes (no `cell.data` indirection).
 * `source`/`target` are converted to EndJSON format.
 * Type defaults to `'standard.Link'` unless provided in data.
 */
function mapDataToLinkAttributes<Link extends GraphLink>(
    options: LinkToGraphOptions<Link>
): dia.Cell.JSON {
    const { id, data } = options;
    const { source, target, type, ...rest } = data;

    return {
        ...rest,
        id,
        type: type ?? 'standard.Link',
        source: getTargetOrSource(source),
        target: getTargetOrSource(target),
    };
}

/**
 * Maps JointJS link attributes directly back to data.
 *
 * Returns all cell attributes except `id`. Data shape mirrors cell JSON.
 * Shape preservation via `previousData`.
 */
function mapLinkAttributesToData<Link extends GraphLink>(
    options: GraphToLinkOptions<Link>
): Link {
    const { cell, previousData } = options;

    const cellData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(cell.attributes)) {
        if (!INTERNAL_KEYS.has(key)) {
            cellData[key] = value;
        }
    }

    if (previousData !== undefined) {
        return applyShapePreservation(cellData, previousData);
    }

    return cellData as Link;
}

/**
 * Native mapper preset.
 *
 * Maps data directly to/from JointJS cell attributes without any indirection.
 * All data properties become cell attributes on the forward path, and all cell
 * attributes (except `id`) are returned on the reverse path.
 *
 * - Elements: `position`/`size` as nested objects (also accepts flat `x,y,width,height`).
 * - Links: `attrs` passed as-is (no theme system), `source`/`target` converted to EndJSON.
 * - No `cell.data` — custom properties are stored as cell attributes directly.
 */
export const nativeMapper: MapperPreset = {
    mapDataToElementAttributes,
    mapDataToLinkAttributes,
    mapElementAttributesToData,
    mapLinkAttributesToData,
};
