import {
  linkMarkerArrow,
  linkMarkerArrowOpen,
  linkMarkerArrowSunken,
  linkMarkerArrowQuill,
  linkMarkerArrowDouble,
  linkMarkerCircle,
  linkMarkerDiamond,
  linkMarkerLine,
  linkMarkerCross,
  linkMarkerFork,
  linkMarkerForkClose,
  linkMarkerMany,
  linkMarkerManyOptional,
  linkMarkerOne,
  linkMarkerOneOptional,
  linkMarkerOneOrMany,
} from '../link-markers';

interface MarkerFactory {
  name: string;
  fn: (options?: Parameters<typeof linkMarkerArrow>[0]) => ReturnType<typeof linkMarkerArrow>;
}

const factories: MarkerFactory[] = [
  { name: 'linkMarkerArrow', fn: linkMarkerArrow },
  { name: 'linkMarkerArrowOpen', fn: linkMarkerArrowOpen },
  { name: 'linkMarkerArrowSunken', fn: linkMarkerArrowSunken },
  { name: 'linkMarkerArrowQuill', fn: linkMarkerArrowQuill },
  { name: 'linkMarkerArrowDouble', fn: linkMarkerArrowDouble },
  { name: 'linkMarkerCircle', fn: linkMarkerCircle },
  { name: 'linkMarkerDiamond', fn: linkMarkerDiamond },
  { name: 'linkMarkerLine', fn: linkMarkerLine },
  { name: 'linkMarkerCross', fn: linkMarkerCross },
  { name: 'linkMarkerFork', fn: linkMarkerFork },
  { name: 'linkMarkerForkClose', fn: linkMarkerForkClose },
  { name: 'linkMarkerMany', fn: linkMarkerMany },
  { name: 'linkMarkerManyOptional', fn: linkMarkerManyOptional },
  { name: 'linkMarkerOne', fn: linkMarkerOne },
  { name: 'linkMarkerOneOptional', fn: linkMarkerOneOptional },
  { name: 'linkMarkerOneOrMany', fn: linkMarkerOneOrMany },
];

describe('presets / link-markers', () => {
  describe.each(factories)('$name', ({ fn }) => {
    it('produces a marker record with markup and length when called with no args', () => {
      const marker = fn();
      expect(marker).toBeDefined();
      expect(marker.markup).toBeDefined();
      expect(typeof marker.length).toBe('number');
    });

    it('respects custom scale', () => {
      const marker = fn({ scale: 2 });
      expect(marker.markup).toBeDefined();
      expect(typeof marker.length).toBe('number');
    });

    it('respects custom fill/stroke/strokeWidth', () => {
      const marker = fn({ fill: 'red', stroke: 'blue', strokeWidth: 4 });
      expect(marker.markup).toBeDefined();
    });
  });

  it('linkMarkerOne always has zero length', () => {
    expect(linkMarkerOne().length).toBe(0);
    expect(linkMarkerOne({ scale: 5 }).length).toBe(0);
  });

  it('linkMarkerArrow length grows with scale and strokeWidth', () => {
    const small = linkMarkerArrow({ scale: 1, strokeWidth: 1 });
    const big = linkMarkerArrow({ scale: 4, strokeWidth: 5 });
    expect(big.length).toBeGreaterThan(small.length ?? 0);
  });
});
