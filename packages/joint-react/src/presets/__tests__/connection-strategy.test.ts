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
});
