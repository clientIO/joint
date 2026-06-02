import {
  createIdentityMatrix,
  createMatrix,
  createPoint,
  createTransform,
  matrixToTransformString,
  parseTransformString,
  type SvgMatrixLike,
} from '../svg-matrix';

const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } as const;

/** Asserts a matrix's six components match `expected` within float tolerance. */
function expectMatrix(matrix: SvgMatrixLike, expected: Omit<SvgMatrixLike, 'multiply' | 'inverse' | 'translate' | 'scale' | 'scaleNonUniform' | 'rotate' | 'flipX' | 'flipY' | 'skewX' | 'skewY'>): void {
  expect(matrix.a).toBeCloseTo(expected.a);
  expect(matrix.b).toBeCloseTo(expected.b);
  expect(matrix.c).toBeCloseTo(expected.c);
  expect(matrix.d).toBeCloseTo(expected.d);
  expect(matrix.e).toBeCloseTo(expected.e);
  expect(matrix.f).toBeCloseTo(expected.f);
}

describe('createMatrix / createIdentityMatrix', () => {
  it('stores the six affine components', () => {
    expectMatrix(createMatrix(1, 2, 3, 4, 5, 6), { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
  });

  it('createIdentityMatrix is the identity', () => {
    expectMatrix(createIdentityMatrix(), IDENTITY);
  });

  it('multiply by identity is a no-op (both sides)', () => {
    const matrix = createMatrix(1, 2, 3, 4, 5, 6);
    expectMatrix(matrix.multiply(createIdentityMatrix()), { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
    expectMatrix(createIdentityMatrix().multiply(matrix), { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
  });

  it('multiply composes two transforms (translate then scale)', () => {
    // translate(10,20) * scale(2): scales then offsets.
    const result = createMatrix(1, 0, 0, 1, 10, 20).multiply(createMatrix(2, 0, 0, 2, 0, 0));
    expectMatrix(result, { a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 });
  });

  it('inverse undoes the matrix (M * M⁻¹ = identity)', () => {
    const matrix = createMatrix(2, 0, 0, 2, 10, 20);
    expectMatrix(matrix.multiply(matrix.inverse()), IDENTITY);
  });

  it('inverse throws on a singular matrix', () => {
    expect(() => createMatrix(1, 2, 2, 4, 0, 0).inverse()).toThrow('Cannot invert a singular matrix.');
  });
});

describe('matrix transform helpers', () => {
  it('translate offsets e/f', () => {
    expectMatrix(createIdentityMatrix().translate(7, 9), { ...IDENTITY, e: 7, f: 9 });
  });

  it('scale and scaleNonUniform set the diagonal', () => {
    expectMatrix(createIdentityMatrix().scale(3), { ...IDENTITY, a: 3, d: 3 });
    expectMatrix(createIdentityMatrix().scaleNonUniform(2, 5), { ...IDENTITY, a: 2, d: 5 });
  });

  it('rotate(90°) maps the x-axis onto the y-axis', () => {
    expectMatrix(createIdentityMatrix().rotate(90), { a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 });
  });

  it('flipX / flipY negate the matching axis', () => {
    expectMatrix(createIdentityMatrix().flipX(), { ...IDENTITY, a: -1 });
    expectMatrix(createIdentityMatrix().flipY(), { ...IDENTITY, d: -1 });
  });

  it('skewX / skewY apply tan(angle) to the off-diagonal', () => {
    expectMatrix(createIdentityMatrix().skewX(45), { ...IDENTITY, c: 1 });
    expectMatrix(createIdentityMatrix().skewY(45), { ...IDENTITY, b: 1 });
  });
});

describe('createPoint', () => {
  it('matrixTransform applies the affine transform', () => {
    const point = createPoint(3, 4).matrixTransform(createMatrix(1, 0, 0, 1, 5, 6));
    expect(point.x).toBeCloseTo(8);
    expect(point.y).toBeCloseTo(10);
  });

  it('rotate(90°) sends (1,0) to (0,1)', () => {
    const point = createPoint(1, 0).matrixTransform(createIdentityMatrix().rotate(90));
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(1);
  });
});

describe('createTransform', () => {
  it('defaults to an identity matrix', () => {
    const transform = createTransform();
    expectMatrix(transform.matrix, IDENTITY);
    expect(transform.angle).toBe(0);
  });

  it('setMatrix and setTranslate update the matrix', () => {
    const transform = createTransform();
    transform.setMatrix(createMatrix(2, 0, 0, 2, 0, 0));
    expectMatrix(transform.matrix, { ...IDENTITY, a: 2, d: 2 });
    transform.setTranslate(3, 4);
    expectMatrix(transform.matrix, { ...IDENTITY, e: 3, f: 4 });
  });
});

describe('matrixToTransformString', () => {
  it('serializes to an SVG matrix() value', () => {
    expect(matrixToTransformString(createMatrix(1, 2, 3, 4, 5, 6))).toBe('matrix(1,2,3,4,5,6)');
  });
});

describe('parseTransformString', () => {
  it('empty / unrecognized input yields the identity', () => {
    expectMatrix(parseTransformString(''), IDENTITY);
    expectMatrix(parseTransformString('unknown(5)'), IDENTITY);
  });

  it('parses translate (with comma or whitespace separators)', () => {
    expectMatrix(parseTransformString('translate(10,20)'), { ...IDENTITY, e: 10, f: 20 });
    expectMatrix(parseTransformString('translate( 10  20 )'), { ...IDENTITY, e: 10, f: 20 });
  });

  it('parses scale (uniform and non-uniform)', () => {
    expectMatrix(parseTransformString('scale(2)'), { ...IDENTITY, a: 2, d: 2 });
    expectMatrix(parseTransformString('scale(2 3)'), { ...IDENTITY, a: 2, d: 3 });
  });

  it('parses rotate', () => {
    expectMatrix(parseTransformString('rotate(90)'), { a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 });
  });

  it('parses an explicit matrix()', () => {
    expectMatrix(parseTransformString('matrix(1,2,3,4,5,6)'), { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
  });

  it('composes a chain preserving JointJS translate-then-rotate origin', () => {
    // translate(x,y) rotate(a): translation stays in e/f, rotation in a–d.
    expectMatrix(parseTransformString('translate(10,20) rotate(90)'), {
      a: 0,
      b: 1,
      c: -1,
      d: 0,
      e: 10,
      f: 20,
    });
  });
});
