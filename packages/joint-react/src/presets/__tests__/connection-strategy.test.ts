/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectionStrategy, type ConnectionStrategyPin } from '../connection-strategy';

describe('connectionStrategy', () => {
  it('throws on unknown pin value', () => {
    expect(() => connectionStrategy({ pin: 'bogus' as ConnectionStrategyPin })).toThrow(
      /connectionStrategy: unknown pin 'bogus'/,
    );
  });

  it('returns a function for the default (no options)', () => {
    expect(typeof connectionStrategy()).toBe('function');
  });

  it('accepts each valid pin value', () => {
    expect(typeof connectionStrategy({ pin: 'none' })).toBe('function');
    expect(typeof connectionStrategy({ pin: 'absolute' })).toBe('function');
    expect(typeof connectionStrategy({ pin: 'relative' })).toBe('function');
  });

  it('returns defaultEnd directly when no customize is provided', () => {
    const function_ = connectionStrategy();
    const endView = {
      paper: { model: {} },
      model: { id: 'm' },
    } as any;
    const endDefinition = { x: 1, y: 2 };
    const out = (function_ as any)(endDefinition, endView, {}, { x: 1, y: 2 }, {}, 'source');
    // useDefaults returns undefined, falls back to endDefinition; no customize, returns it
    expect(out).toBe(endDefinition);
  });
});
