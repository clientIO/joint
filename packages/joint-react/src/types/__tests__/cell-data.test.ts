import type {
  CellData,
  CellItem,
  ElementItem,
  ElementLayout,
  ElementInput,
  ElementPosition,
  ElementSize,
  LinkItem,
  LinkInput,
  LinkEnd,
} from '../cell-data';
import { DEFAULT_ELEMENT_LAYOUT } from '../cell-data';

// ── Type-level assertions ───────────────────────────────────────────────────

// CellData accepts any Record<string, unknown>
type AssertCellData = { label: string } extends CellData ? true : false;
const _assertCellData: AssertCellData = true;

// ElementItem has typed data field
type AssertElementItemData = ElementItem<{
  label: string;
}>['data'] extends { label: string }
  ? true
  : false;
const _assertElementItemData: AssertElementItemData = true;

// ElementInput extends ElementItem + Partial<ElementLayout>
type AssertElementInputLayout = ElementInput<{
  label: string;
}> extends { x?: number; data: { label: string } }
  ? true
  : false;
const _assertElementInputLayout: AssertElementInputLayout = true;

// ElementLayout has all required fields
type AssertLayoutRequired = ElementLayout extends {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}
  ? true
  : false;
const _assertLayoutRequired: AssertLayoutRequired = true;

// LinkInput equals LinkItem
type AssertLinkInput = LinkInput<{ weight: number }> extends LinkItem<{
  weight: number;
}>
  ? true
  : false;
const _assertLinkInput: AssertLinkInput = true;

// LinkEnd accepts string or point
type AssertLinkEndString = string extends LinkEnd ? true : false;
const _assertLinkEndString: AssertLinkEndString = true;
type AssertLinkEndPoint = { x: number; y: number } extends LinkEnd
  ? true
  : false;
const _assertLinkEndPoint: AssertLinkEndPoint = true;

// Prevent unused variable warnings
void _assertCellData;
void _assertElementItemData;
void _assertElementInputLayout;
void _assertLayoutRequired;
void _assertLinkInput;
void _assertLinkEndString;
void _assertLinkEndPoint;

// ── Runtime tests ───────────────────────────────────────────────────────────

describe('cell-data types', () => {
  it('ElementInput accepts user data with optional layout', () => {
    const input: ElementInput<{ label: string }> = {
      data: { label: 'test' },
      x: 100,
      y: 50,
    };
    expect(input.data.label).toBe('test');
    expect(input.x).toBe(100);
  });

  it('ElementInput works without layout fields', () => {
    const input: ElementInput<{ label: string }> = {
      data: { label: 'test' },
    };
    expect(input.data.label).toBe('test');
    expect(input.x).toBeUndefined();
  });

  it('ElementLayout has all required fields', () => {
    const layout: ElementLayout = {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      angle: 0,
    };
    expect(layout.x).toBe(0);
    expect(layout.width).toBe(100);
  });

  it('ElementPosition is a subset of ElementLayout', () => {
    const layout: ElementLayout = {
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      angle: 0,
    };
    const position: ElementPosition = { x: layout.x, y: layout.y };
    expect(position.x).toBe(10);
    expect(position.y).toBe(20);
  });

  it('ElementSize is a subset of ElementLayout', () => {
    const layout: ElementLayout = {
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      angle: 0,
    };
    const size: ElementSize = { width: layout.width, height: layout.height };
    expect(size.width).toBe(100);
    expect(size.height).toBe(50);
  });

  it('LinkItem accepts user data with connection info', () => {
    const link: LinkItem<{ weight: number }> = {
      data: { weight: 5 },
      source: 'el-1',
      target: 'el-2',
    };
    expect(link.data.weight).toBe(5);
    expect(link.source).toBe('el-1');
  });

  it('LinkItem accepts point-based endpoints', () => {
    const link: LinkItem<{ weight: number }> = {
      data: { weight: 3 },
      source: { x: 0, y: 0 },
      target: { x: 100, y: 100 },
    };
    expect(link.source).toEqual({ x: 0, y: 0 });
  });

  it('ElementItem inherits CellItem properties', () => {
    const item: ElementItem<{ label: string }> = {
      data: { label: 'test' },
      z: 5,
      parent: 'group-1',
      layer: 'foreground',
    };
    const cellItem: CellItem = item;
    expect(cellItem.z).toBe(5);
    expect(cellItem.parent).toBe('group-1');
  });

  it('DEFAULT_ELEMENT_LAYOUT provides sensible defaults', () => {
    expect(DEFAULT_ELEMENT_LAYOUT.x).toBe(0);
    expect(DEFAULT_ELEMENT_LAYOUT.y).toBe(0);
    expect(DEFAULT_ELEMENT_LAYOUT.width).toBe(1);
    expect(DEFAULT_ELEMENT_LAYOUT.height).toBe(1);
    expect(DEFAULT_ELEMENT_LAYOUT.angle).toBe(0);
  });

  it('ElementInput with ports stays on ElementItem level', () => {
    const input: ElementInput<{ label: string }> = {
      data: { label: 'test' },
      x: 100,
      y: 50,
      width: 150,
      height: 60,
      ports: {
        p1: { cx: 0, cy: '50%' },
        p2: { cx: 'calc(w)', cy: 'calc(h)' },
      },
    };
    expect(input.ports?.p1.cx).toBe(0);
    expect(input.ports?.p2.cy).toBe('calc(h)');
    // ports are on ElementItem, not inside data
    expect((input.data as Record<string, unknown>).ports).toBeUndefined();
  });
});
