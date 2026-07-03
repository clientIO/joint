import { resolveLinkMarker, namedLinkMarkers } from '../named-link-markers';
import type { LinkMarkerRecord } from '../../presets/link-markers';

describe('namedLinkMarkers', () => {
  it('exposes built-in marker presets', () => {
    expect(namedLinkMarkers.none).toBeNull();
    expect(namedLinkMarkers.arrow).toBeDefined();
    expect(namedLinkMarkers['arrow-open']).toBeDefined();
    expect(namedLinkMarkers['arrow-sunken']).toBeDefined();
    expect(namedLinkMarkers.circle).toBeDefined();
    expect(namedLinkMarkers.diamond).toBeDefined();
  });
});

describe('resolveLinkMarker', () => {
  it('returns null when marker is undefined', () => {
    const noMarker: undefined = undefined;
    expect(resolveLinkMarker(noMarker)).toBeNull();
  });

  it('returns null when marker is the "none" preset', () => {
    expect(resolveLinkMarker('none')).toBeNull();
  });

  it('resolves a named marker string to its preset record', () => {
    const resolved = resolveLinkMarker('arrow');
    expect(resolved).not.toBeNull();
    expect(resolved).toBe(namedLinkMarkers.arrow);
  });

  it('returns null when a named string does not match any preset', () => {
    // unknown name — namedLinkMarkers lookup returns undefined → falsy → null
    const resolved = resolveLinkMarker('not-a-real-marker' as never);
    expect(resolved).toBeNull();
  });

  it('returns the same record when given a custom marker object', () => {
    const customMarker: LinkMarkerRecord = {
      markup: [{ tagName: 'path', attributes: { d: 'M 0 0 L 10 10' } }],
      length: 5,
    };
    expect(resolveLinkMarker(customMarker)).toBe(customMarker);
  });
});
