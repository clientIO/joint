import { useContext } from 'react';
import { GraphStoreContext } from '../context';
import type { GraphStore } from '../store';
import type { BaseElementRecord, BaseLinkRecord } from '../types/cell.types';

/**
 * Hook for accessing the `GraphStore` from a `GraphProvider`.
 * Each call site narrows the store's record shape via its own generics.
 * @template Element - element record shape (must extend `BaseElementRecord`)
 * @template Link - link record shape (must extend `BaseLinkRecord`)
 * @group Hooks
 * @returns The JointJS graph store narrowed to the consumer's record shape.
 * @throws {Error} If used outside of a `GraphProvider`.
 */
export function useGraphStore<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
>(): GraphStore<Element, Link> {
  const store = useContext(GraphStoreContext);
  if (!store) {
    throw new Error('useGraphStore must be used within a GraphProvider');
  }
  // Boundary downcast through `unknown` is required: `GraphStore<E, L>` is
  // invariant in its generic parameters (methods both consume and produce E
  // and L), so TS rejects a direct cast between two parameterisations of
  // the same class. Each call site re-binds the generics to its own record
  // shape; the runtime value is the same store instance — see
  // `context/index.ts` for the unparameterised context declaration.
  return store as unknown as GraphStore<Element, Link>;
}
