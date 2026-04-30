 
 
/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Type-only tests for `useCells`. The `expectType` helper forces TypeScript to
 * check structural assignability at compile time — if the file compiles, the
 * contract holds. There is no runtime behavior being tested here; the dummy
 * `describe`/`it` exists only so Jest does not error on a test file with no
 * test cases.
 *
 * Locked patterns (DX contract):
 * - `useCells()` → `ReadonlyArray<Computed<CellRecord>>`
 * - `useCells<MyElement>()` → `readonly MyElement[]`
 * - `useCells((cells: readonly MyElement[]) => ...)` — Cell inferred from selector
 * - `useCells((cells) => cells.length)` — untyped selector, default Cell
 * - `useCells<MyElement, Selected>(selector)` — both generics explicit
 * - `useCells<MyElement>(id)` → single resolved Cell
 * - `useCells<MyElement>(ids)` → array of resolved Cells
 * - Discriminant narrowing on default `Computed<CellRecord>` and on user unions
 *
 * Anti-patterns NOT to lock — `Computed<CellRecord>` is a union, so accessing
 * record-specific fields like `.position` directly returns `unknown` due to
 * the index signatures on `LinkAttributes` / `CustomRecord`. Always annotate
 * the selector parameter as `Computed<ElementRecord<…>>` or
 * `Computed<LinkRecord<…>>` when reading record-specific fields.
 */
import { useCells } from '../use-cells';
import type {
  DiaElementAttributes,
  CellId,
  Computed,
  ElementRecord,
  LinkRecord,
  CellRecord,
} from '../../types/cell.types';

interface ElementUserData {
  readonly label: string;
}
interface LinkUserData {
  readonly kind: string;
}
type MyElement = Computed<ElementRecord<ElementUserData>>;
type MyLink = Computed<LinkRecord<LinkUserData>>;

/** Compile-time assertion that `actual` is assignable to `Expected`. */
const expectType = <Expected>(_actual: Expected): void => {
  /* type-only check */
};

// All hook calls below are wrapped in `if (false)` so TypeScript still
// type-checks them, but Jest never executes them — these are pure
// compile-time assertions and the hooks would throw at module scope.

if (false as boolean) {
  // no args — readonly array of resolved cell records
  expectType<ReadonlyArray<Computed<CellRecord>>>(useCells());

  // explicit Cell generic — narrows array element type
  expectType<readonly MyElement[]>(useCells<MyElement>());

  // selector annotated — both Cell and Selected inferred
  expectType<string[]>(
    useCells((cells: readonly MyElement[]) => cells.map((cell) => cell.data.label))
  );

  // selector returns filtered narrowed array
  expectType<MyElement[]>(
    useCells((cells: readonly MyElement[]) => cells.filter((cell) => cell.position.y < 100))
  );

  // link-typed cells
  expectType<ReadonlyArray<readonly [CellId | undefined, CellId | undefined]>>(
    useCells((links: readonly MyLink[]) =>
      links.map((link) => [link.source.id, link.target.id] as const)
    )
  );

  // untyped selector — Cell defaults; .length is universal
  expectType<number>(useCells((cells) => cells.length));

  // both generics explicit
  expectType<string[]>(
    useCells<MyElement, string[]>((cells) => cells.map((cell) => cell.data.label))
  );

  // id form
  expectType<MyElement | undefined>(useCells<MyElement>('some-id'));

  // id list
  expectType<readonly MyElement[]>(useCells<MyElement>(['a', 'b']));

  // id with selector — returns Selected
  expectType<string | undefined>(
    useCells<MyElement, string | undefined>('some-id', (cell) => cell?.data.label)
  );

  // id list with selector — returns Selected
  expectType<readonly string[]>(
    useCells<MyElement, readonly string[]>(['a', 'b'], (cells) =>
      cells.map((cell) => cell.data.label)
    )
  );

  // selector returns size on element record
  expectType<{ width: number; height: number } | undefined>(
    useCells((cells: readonly MyElement[]) => cells[0]?.size)
  );

  // User-defined custom cell with literal type — narrowing works
  interface MyCustomNode extends DiaElementAttributes {
    readonly id: CellId;
    readonly type: 'my-custom';
    readonly data: { readonly foo: string };
  }
  type AppCell = Computed<CellRecord> | MyCustomNode;

  expectType<readonly string[]>(
    useCells((cells: readonly AppCell[]) =>
      cells.flatMap((cell) => (cell.type === 'my-custom' ? [cell.data.foo] : []))
    )
  );

  // Custom link-flavoured record narrows from union
  interface MyCustomEdge extends DiaElementAttributes {
    readonly id: CellId;
    readonly type: 'my-edge';
    readonly data: { readonly weight: number };
  }
  type AppCellWithEdge = Computed<CellRecord> | MyCustomNode | MyCustomEdge;

  expectType<readonly number[]>(
    useCells((cells: readonly AppCellWithEdge[]) =>
      cells.flatMap((cell) => (cell.type === 'my-edge' ? [cell.data.weight] : []))
    )
  );
} // close if (false) compile-only block

// runtime no-op so Jest accepts the file
describe('useCells type contract', () => {
  it('compiles', () => {
    expect(true).toBe(true);
  });
});
