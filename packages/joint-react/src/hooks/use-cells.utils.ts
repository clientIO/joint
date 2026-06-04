import { type mvc, type dia } from '@joint/core';
import type { AnyCellRecord, CellId } from '../types/cell.types';
import { isCollection } from '../utils/is';

/** Normalised arguments after dispatching by the runtime call shape. */
export interface ParsedCellsArgs<Cell extends AnyCellRecord, Selected> {
  readonly targetId: CellId | undefined;
  readonly ids: readonly CellId[] | undefined;
  readonly isCollectionForm: boolean;
  readonly arraySelector: ((cells: readonly Cell[]) => Selected) | undefined;
  readonly cellSelector: ((cell: Cell | undefined) => Selected) | undefined;
  readonly isEqual: ((a: Selected, b: Selected) => boolean) | undefined;
}

/** Builds default parsed result with no selectors. */
function defaultParsedArgs<Cell extends AnyCellRecord, Selected>(
  targetId: CellId | undefined,
  ids: readonly CellId[] | undefined
): ParsedCellsArgs<Cell, Selected> {
  return {
    targetId,
    ids,
    isCollectionForm: false,
    arraySelector: undefined,
    cellSelector: undefined,
    isEqual: undefined,
  };
}

/**
 * Parses the collection form: `useCells(collection)` or `useCells(collection, selector, isEqual?)`.
 */
function parseCollectionArgs<Cell extends AnyCellRecord, Selected>(
  argument2: unknown,
  argument3: unknown
): ParsedCellsArgs<Cell, Selected> {
  return {
    targetId: undefined,
    ids: undefined,
    isCollectionForm: true,
    arraySelector:
      typeof argument2 === 'function'
        ? (argument2 as (cells: readonly Cell[]) => Selected)
        : undefined,
    cellSelector: undefined,
    isEqual:
      typeof argument3 === 'function'
        ? (argument3 as (a: Selected, b: Selected) => boolean)
        : undefined,
  };
}

/** Parses the `useCells(selector, isEqual?)` form. */
function parseSelectorFirstArgs<Cell extends AnyCellRecord, Selected>(
  selectorArgument: (cells: readonly Cell[]) => Selected,
  isEqualArgument: unknown
): ParsedCellsArgs<Cell, Selected> {
  return {
    targetId: undefined,
    ids: undefined,
    isCollectionForm: false,
    arraySelector: selectorArgument,
    cellSelector: undefined,
    isEqual:
      typeof isEqualArgument === 'function'
        ? (isEqualArgument as (a: Selected, b: Selected) => boolean)
        : undefined,
  };
}

/**
 * Classifies the runtime arguments of `useCells` into a normalised shape so
 * the hook body can stay flat and cheap to read.
 * @param argument1 - first positional arg (id, ids, collection, or selector)
 * @param argument2 - second positional arg (selector or isEqual depending on form)
 * @param argument3 - third positional arg (isEqual when the form admits it)
 * @returns the normalised input
 */
export function parseUseCellsArgs<Cell extends AnyCellRecord, Selected>(
  argument1?:
    | CellId
    | readonly CellId[]
    | ((cells: readonly Cell[]) => Selected)
    | mvc.Collection<dia.Cell>,
  argument2?:
    | ((cells: readonly Cell[]) => Selected)
    | ((cell: Cell | undefined) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): ParsedCellsArgs<Cell, Selected> {
  if (isCollection(argument1)) {
    return parseCollectionArgs<Cell, Selected>(argument2, argument3);
  }
  if (typeof argument1 === 'function') {
    return parseSelectorFirstArgs<Cell, Selected>(argument1, argument2);
  }

  const isIdsArray = Array.isArray(argument1);
  const isSingleId = !isIdsArray && argument1 !== undefined;
  const targetId: CellId | undefined = isSingleId ? (argument1 as CellId) : undefined;
  const ids: readonly CellId[] | undefined = isIdsArray
    ? (argument1 as readonly CellId[])
    : undefined;

  if (isIdsArray) {
    return {
      targetId,
      ids,
      isCollectionForm: false,
      arraySelector:
        typeof argument2 === 'function'
          ? (argument2 as (cells: readonly Cell[]) => Selected)
          : undefined,
      cellSelector: undefined,
      isEqual: typeof argument3 === 'function' ? argument3 : undefined,
    };
  }
  if (isSingleId && typeof argument2 === 'function') {
    return {
      targetId,
      ids,
      isCollectionForm: false,
      arraySelector: undefined,
      cellSelector: argument2 as (cell: Cell | undefined) => Selected,
      isEqual: typeof argument3 === 'function' ? argument3 : undefined,
    };
  }
  return defaultParsedArgs<Cell, Selected>(targetId, ids);
}
