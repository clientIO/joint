/* eslint-disable unicorn/prevent-abbreviations */
/**
 * Pure SVG geometry primitives — affine matrix, point, transform, and a
 * `transform` attribute parser. No DOM access; used by the SVG polyfills to give
 * `@joint/core`'s Vectorizer real geometry on a headless DOM (jsdom has none).
 */

/** Minimal affine 2D matrix matching the `SVGMatrix` surface JointJS uses. */
export interface SvgMatrixLike {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  multiply: (other: SvgMatrixLike) => SvgMatrixLike;
  inverse: () => SvgMatrixLike;
  translate: (x: number, y: number) => SvgMatrixLike;
  scale: (factor: number) => SvgMatrixLike;
  scaleNonUniform: (scaleX: number, scaleY: number) => SvgMatrixLike;
  rotate: (degrees: number) => SvgMatrixLike;
  flipX: () => SvgMatrixLike;
  flipY: () => SvgMatrixLike;
  skewX: (degrees: number) => SvgMatrixLike;
  skewY: (degrees: number) => SvgMatrixLike;
}

/** Minimal `SVGPoint` surface (`matrixTransform` only). */
export interface SvgPointLike {
  x: number;
  y: number;
  matrixTransform: (matrix: SvgMatrixLike) => SvgPointLike;
}

/** Minimal `SVGTransform` surface (`matrix` + setters). */
export interface SvgTransformLike {
  matrix: SvgMatrixLike;
  angle: number;
  type: number;
  setMatrix: (matrix: SvgMatrixLike) => void;
  setTranslate: (x: number, y: number) => void;
}

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Creates an affine 2D matrix `[a c e; b d f; 0 0 1]` with `SVGMatrix` methods.
 * `a`–`f` are the universal SVGMatrix component names.
 */
export function createMatrix(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
): SvgMatrixLike {
  return {
    a,
    b,
    c,
    d,
    e,
    f,
    multiply(other) {
      return createMatrix(
        this.a * other.a + this.c * other.b,
        this.b * other.a + this.d * other.b,
        this.a * other.c + this.c * other.d,
        this.b * other.c + this.d * other.d,
        this.a * other.e + this.c * other.f + this.e,
        this.b * other.e + this.d * other.f + this.f
      );
    },
    inverse() {
      const determinant = this.a * this.d - this.b * this.c;
      if (determinant === 0) {
        throw new Error('Cannot invert a singular matrix.');
      }
      const inverseA = this.d / determinant;
      const inverseB = -this.b / determinant;
      const inverseC = -this.c / determinant;
      const inverseD = this.a / determinant;
      return createMatrix(
        inverseA,
        inverseB,
        inverseC,
        inverseD,
        -(inverseA * this.e + inverseC * this.f),
        -(inverseB * this.e + inverseD * this.f)
      );
    },
    translate(x, y) {
      return this.multiply(createMatrix(1, 0, 0, 1, x, y));
    },
    scale(factor) {
      return this.multiply(createMatrix(factor, 0, 0, factor, 0, 0));
    },
    scaleNonUniform(scaleX, scaleY) {
      return this.multiply(createMatrix(scaleX, 0, 0, scaleY, 0, 0));
    },
    rotate(degrees) {
      const radians = degrees * DEGREES_TO_RADIANS;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      return this.multiply(createMatrix(cos, sin, -sin, cos, 0, 0));
    },
    flipX() {
      return this.multiply(createMatrix(-1, 0, 0, 1, 0, 0));
    },
    flipY() {
      return this.multiply(createMatrix(1, 0, 0, -1, 0, 0));
    },
    skewX(degrees) {
      return this.multiply(createMatrix(1, 0, Math.tan(degrees * DEGREES_TO_RADIANS), 1, 0, 0));
    },
    skewY(degrees) {
      return this.multiply(createMatrix(1, Math.tan(degrees * DEGREES_TO_RADIANS), 0, 1, 0, 0));
    },
  };
}

/** The identity matrix. */
export function createIdentityMatrix(): SvgMatrixLike {
  return createMatrix(1, 0, 0, 1, 0, 0);
}

/** Creates an `SVGPoint`-like object. */
export function createPoint(x: number, y: number): SvgPointLike {
  return {
    x,
    y,
    matrixTransform(matrix) {
      return createPoint(
        matrix.a * this.x + matrix.c * this.y + matrix.e,
        matrix.b * this.x + matrix.d * this.y + matrix.f
      );
    },
  };
}

/** Creates an `SVGTransform`-like object (identity matrix by default). */
export function createTransform(): SvgTransformLike {
  return {
    matrix: createIdentityMatrix(),
    angle: 0,
    type: 0,
    setMatrix(matrix) {
      this.matrix = matrix;
    },
    setTranslate(x, y) {
      this.matrix = createMatrix(1, 0, 0, 1, x, y);
    },
  };
}

/**
 * Creates an `SVGTransform`-like object preset to a matrix — the
 * `createSVGTransformFromMatrix` factory shape.
 * @param matrix - the matrix to seed the transform with.
 * @returns a transform whose `matrix` is the supplied matrix.
 */
export function createTransformFromMatrix(matrix: SvgMatrixLike): SvgTransformLike {
  const transform = createTransform();
  transform.setMatrix(matrix);
  return transform;
}

/** Serializes a matrix to an SVG `transform="matrix(...)"` value. */
export function matrixToTransformString(matrix: SvgMatrixLike): string {
  return `matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e},${matrix.f})`;
}

// eslint-disable-next-line sonarjs/slow-regex
const TRANSFORM_FUNCTION = /([a-z]+)\(([^()]*)\)/gi;

/**
 * Parses an SVG `transform` attribute string into a single matrix — the real
 * geometry JointJS expects from `transform.baseVal.consolidate()`. `rotate` and
 * `scale` use the element's local origin, matching JointJS's
 * `translate(x,y) rotate(a)` output.
 * @param value - the `transform` attribute string.
 * @returns the combined transformation matrix.
 */
export function parseTransformString(value: string): SvgMatrixLike {
  let matrix = createIdentityMatrix();
  for (const [, name, rawArguments] of value.matchAll(TRANSFORM_FUNCTION)) {
    const values = rawArguments
      .trim()
      .split(/[\s,]+/)
      .filter((part) => part !== '')
      .map(Number)
      .filter((part) => !Number.isNaN(part));
    switch (name) {
      case 'matrix': {
        const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = values;
        matrix = matrix.multiply(createMatrix(a, b, c, d, e, f));
        break;
      }
      case 'translate': {
        matrix = matrix.translate(values[0] ?? 0, values[1] ?? 0);
        break;
      }
      case 'scale': {
        matrix = matrix.scaleNonUniform(values[0] ?? 1, values[1] ?? values[0] ?? 1);
        break;
      }
      case 'rotate': {
        matrix = matrix.rotate(values[0] ?? 0);
        break;
      }
      case 'skewX': {
        matrix = matrix.skewX(values[0] ?? 0);
        break;
      }
      case 'skewY': {
        matrix = matrix.skewY(values[0] ?? 0);
        break;
      }
      default: {
        break;
      }
    }
  }
  return matrix;
}
