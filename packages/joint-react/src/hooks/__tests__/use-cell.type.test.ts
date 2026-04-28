/* eslint-disable sonarjs/no-redundant-jump */
/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Type-only tests for `useCell` and `useCells`. The `expectType` helper
 * forces TypeScript to check structural assignability at compile time —
 * if the file compiles, the contract holds. There is no runtime behavior
 * being tested here; the dummy `describe`/`it` exists only so Jest does
 * not error on a test file with no test cases.
 *
 * Locked patterns (DX contract):
 * - `useCell()` → `ResolvedCellRecord` (union)
 * - `useCell<MyElement>()` → `MyElement`
 * - `useCell((el: MyElement) => el.data.foo)` → typeof `data.foo`
 * - `useCell((cell) => cell.id)` → `cell` is `ResolvedCellRecord`, `cell.id` is `CellId`
 * - `useCell<MyElement, MyReturn>(selector)` — both generics explicit, Cell narrow
 * - Same shapes for `useCells` (array form)
 *
 * Anti-patterns NOT to lock — `ResolvedCellRecord` is a union, so accessing
 * record-specific fields like `.position` directly returns `unknown` due to
 * the index signatures on `BaseLinkRecord` / `CustomRecord`. Always annotate
 * the selector parameter as `ResolvedElementRecord<…>` or
 * `ResolvedLinkRecord<…>` when reading record-specific fields.
 */
import { useCell } from '../use-cell';
import { useCells } from '../use-cells';
import type {
  BaseElementRecord,
  CellId,
  ResolvedCellRecord,
  ResolvedElementRecord,
  ResolvedLinkRecord,
} from '../../types/cell.types';
import type { ElementPosition } from '../../types/cell-data';

interface ElementUserData {
  readonly label: string;
}
interface LinkUserData {
  readonly kind: string;
}
type MyElement = ResolvedElementRecord<ElementUserData>;
type MyLink = ResolvedLinkRecord<LinkUserData>;

/** Compile-time assertion that `actual` is assignable to `Expected`. */
const expectType = <Expected>(_actual: Expected): void => {
  /* type-only check */
};

// All hook calls below are wrapped in `if (false)` so TypeScript still
// type-checks them, but Jest never executes them — these are pure
// compile-time assertions and the hooks would throw at module scope.
// eslint-disable-next-line sonarjs/no-redundant-boolean
if (false as boolean) {

// ── useCell ────────────────────────────────────────────────────────────────

// no args, no generic — defaults to ResolvedCellRecord
expectType<ResolvedCellRecord>(useCell());

// explicit Cell generic — narrows return
expectType<MyElement>(useCell<MyElement>());

// selector annotated as element — Cell inferred from annotation, returns data field
expectType<string>(useCell((element: MyElement) => element.data.label));

// selector annotated as link — Cell inferred to MyLink
expectType<LinkUserData>(useCell((link: MyLink) => link.data));

// selector returning required position field on element record
expectType<{ x: number; y: number }>(useCell((el: MyElement) => el.position));

// selector returning required size field on element record
expectType<{ width: number; height: number }>(useCell((el: MyElement) => el.size));

// untyped selector — Cell defaults to ResolvedCellRecord; .id required on Resolved variants
expectType<CellId>(useCell((cell) => cell.id));

// id-targeted, no selector — defaults to ResolvedCellRecord
expectType<ResolvedCellRecord>(useCell('some-id'));

// id-targeted with explicit Cell generic
expectType<MyElement>(useCell<MyElement>('some-id'));

// id-targeted with selector annotated
expectType<string>(useCell('some-id', (el: MyElement) => el.data.label));

// both generics explicit
expectType<{ x: number; y: number }>(
  useCell<MyElement, { x: number; y: number }>((el) => el.position)
);

// ── useCells ───────────────────────────────────────────────────────────────

// no args — readonly array of resolved cell records
expectType<readonly ResolvedCellRecord[]>(useCells());

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

// Discriminant narrowing on default ResolvedCellRecord (no annotation)
expectType<Required<ElementPosition>>(
  useCell((cell) => {
    if (cell.type === 'element') {
      return cell.position;
    }
    return { x: 0, y: 0 };
  })
);

// User-defined custom cell with literal type — narrowing works
interface MyCustomNode extends BaseElementRecord {
  readonly id: CellId;
  readonly type: 'my-custom';
  readonly data: { readonly foo: string };
}
type AppCell = ResolvedCellRecord | MyCustomNode;

expectType<string | undefined>(
  useCell((cell: AppCell) => {
    if (cell.type === 'my-custom') return cell.data.foo;
    return;
  })
);

// Custom link-flavoured record narrows from union
interface MyCustomEdge extends BaseElementRecord {
  readonly id: CellId;
  readonly type: 'my-edge';
  readonly data: { readonly weight: number };
}
type AppCellWithEdge = ResolvedCellRecord | MyCustomNode | MyCustomEdge;

expectType<number | undefined>(
  useCell((cell: AppCellWithEdge) => {
    if (cell.type === 'my-edge') return cell.data.weight;
    return;
  })
);

} // close if (false) compile-only block

// runtime no-op so Jest accepts the file
describe('useCell / useCells type contract', () => {
  it('compiles', () => {
    expect(true).toBe(true);
  });
});
