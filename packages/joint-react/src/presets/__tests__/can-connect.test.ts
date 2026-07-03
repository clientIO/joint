/* eslint-disable @typescript-eslint/no-explicit-any */
import { canConnect, toConnectionEnd } from '../can-connect';

interface MagnetSpec {
  port?: string;
  jointSelector?: string;
}

function makeMagnet(spec?: MagnetSpec): SVGElement | undefined {
  if (!spec) return undefined;
  const m = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  if (spec.port) m.setAttribute('port', spec.port);
  if (spec.jointSelector) m.setAttribute('joint-selector', spec.jointSelector);
  return m;
}

function makeCellView(options: {
  id: string;
  isElement?: boolean;
  hasPorts?: boolean;
  paperLinks?: any[];
}) {
  const { id, isElement = true, hasPorts = false, paperLinks = [] } = options;
  const model: any = {
    id,
    isElement: () => isElement,
    isLink: () => !isElement,
    hasPorts: () => hasPorts,
  };
  const view: any = {
    model,
    findAttribute: (name: string, magnet: Element | undefined) =>
      magnet?.getAttribute(name) ?? null,
    paper: {
      model: {
        getConnectedLinks: jest.fn(() => paperLinks),
      },
    },
  };
  return view;
}

describe('presets / can-connect / toConnectionEnd', () => {
  it('returns null fields when no magnet', () => {
    const view = makeCellView({ id: 'a' });
    const noMagnet: undefined = undefined;
    const end = toConnectionEnd(view, noMagnet);
    expect(end.id).toBe('a');
    expect(end.port).toBeNull();
    expect(end.magnet).toBeNull();
    expect(end.selector).toBeNull();
  });

  it('reads port and selector from magnet', () => {
    const view = makeCellView({ id: 'a' });
    const magnet = makeMagnet({ port: 'p1', jointSelector: 'body' });
    const end = toConnectionEnd(view, magnet);
    expect(end.port).toBe('p1');
    expect(end.selector).toBe('body');
    expect(end.magnet).toBe(magnet);
  });

  it('returns null selector when missing on magnet', () => {
    const view = makeCellView({ id: 'a' });
    const magnet = makeMagnet({ port: 'p1' });
    const end = toConnectionEnd(view, magnet);
    expect(end.selector).toBeNull();
  });
});

describe('presets / can-connect / canConnect built-in rules', () => {
  it('rejects self-loops by default', () => {
    const view = makeCellView({ id: 'same' });
    const linkView = { model: {} } as any;
    const function_ = canConnect();
    expect(function_(view, undefined, view, undefined, 'target', linkView)).toBe(false);
  });

  it('allows self-loops when configured', () => {
    const view = makeCellView({ id: 'same' });
    const linkView = { model: {} } as any;
    const function_ = canConnect({ allowSelfLoops: true });
    expect(function_(view, undefined, view, undefined, 'target', linkView)).toBe(true);
  });

  it('rejects link-to-link by default (source is link)', () => {
    const sourceView = makeCellView({ id: 'l', isElement: false });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(false);
  });

  it('rejects link-to-link by default (target is link)', () => {
    const sourceView = makeCellView({ id: 's' });
    const targetView = makeCellView({ id: 'l', isElement: false });
    const linkView = { model: {} } as any;
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(false);
  });

  it('allows link-to-link when configured', () => {
    const sourceView = makeCellView({ id: 'l', isElement: false });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const function_ = canConnect({ allowLinkToLink: true });
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('blocks root connection in auto mode when target has ports', () => {
    const sourceView = makeCellView({ id: 's', hasPorts: false });
    const targetView = makeCellView({ id: 't', hasPorts: true });
    const linkView = { model: {} } as any;
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(false);
  });

  it('allows root connection in auto mode when target has no ports', () => {
    const sourceView = makeCellView({ id: 's' });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('always allows root when allowRootConnection=true', () => {
    const sourceView = makeCellView({ id: 's', hasPorts: true });
    const targetView = makeCellView({ id: 't', hasPorts: true });
    const linkView = { model: {} } as any;
    const function_ = canConnect({ allowRootConnection: true });
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('always blocks root when allowRootConnection=false', () => {
    const sourceView = makeCellView({ id: 's' });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const function_ = canConnect({ allowRootConnection: false });
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(false);
  });

  it('with magnet, root-blocked check returns false (magnet present)', () => {
    const sourceView = makeCellView({ id: 's' });
    const targetView = makeCellView({ id: 't' });
    const sourceMagnet = makeMagnet({ port: 'p' });
    const targetMagnet = makeMagnet({ port: 'q' });
    const linkView = { model: {} } as any;
    const function_ = canConnect({ allowRootConnection: false });
    expect(function_(sourceView, sourceMagnet, targetView, targetMagnet, 'target', linkView)).toBe(true);
  });

  it('rejects duplicate links by default', () => {
    const linkModel = {};
    const existingLink = {
      source: () => ({ id: 's', port: null }),
      target: () => ({ id: 't', port: null }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existingLink] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: linkModel } as any;
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(false);
  });

  it('skips the link being validated when checking duplicates', () => {
    const sameLink = {
      source: () => ({ id: 's' }),
      target: () => ({ id: 't' }),
    };
    // The "existing" link is the link being validated itself
    const sourceView = makeCellView({ id: 's', paperLinks: [sameLink] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: sameLink } as any;
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('allows multiple links when configured', () => {
    const existing = {
      source: () => ({ id: 's' }),
      target: () => ({ id: 't' }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existing] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const function_ = canConnect({ allowMultiLinks: true });
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('treats different ids as non-duplicate', () => {
    const existing = {
      source: () => ({ id: 'other' }),
      target: () => ({ id: 't' }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existing] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('treats different ports as non-duplicate', () => {
    const existing = {
      source: () => ({ id: 's', port: 'p1' }),
      target: () => ({ id: 't', port: null }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existing] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    // New link has source port 'p2' instead of 'p1'
    const sourceMagnet = makeMagnet({ port: 'p2' });
    const function_ = canConnect();
    expect(function_(sourceView, sourceMagnet, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('matches duplicate based on magnet selector when no ports', () => {
    const existing = {
      source: () => ({ id: 's', selector: 'body' }),
      target: () => ({ id: 't' }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existing] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const sourceMagnet = makeMagnet({ jointSelector: 'body' });
    const function_ = canConnect();
    expect(function_(sourceView, sourceMagnet, targetView, undefined, 'target', linkView)).toBe(false);
  });

  it('non-port magnet without selector attribute returns null selector in duplicate check', () => {
    const existing = {
      source: () => ({ id: 's', magnet: null, selector: null }),
      target: () => ({ id: 't' }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existing] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    // Magnet without joint-selector attribute and without port -> getEndMagnetSelector returns null
    const sourceMagnet = makeMagnet({});
    const function_ = canConnect();
    expect(function_(sourceView, sourceMagnet, targetView, undefined, 'target', linkView)).toBe(false);
  });

  it('non-port magnet without selector compared to existing magnet field', () => {
    const existing = {
      source: () => ({ id: 's', magnet: 'body' }),
      target: () => ({ id: 't' }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existing] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const function_ = canConnect();
    // Different magnet (root vs body) - not a duplicate
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(true);
  });

  it('different target ports skip duplicate', () => {
    const existing = {
      source: () => ({ id: 's', port: null }),
      target: () => ({ id: 't', port: 'tport' }),
    };
    const sourceView = makeCellView({ id: 's', paperLinks: [existing] });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const targetMagnet = makeMagnet({ port: 'other' });
    const function_ = canConnect();
    expect(function_(sourceView, undefined, targetView, targetMagnet, 'target', linkView)).toBe(true);
  });

  it('runs validate callback when built-in checks pass', () => {
    const sourceView = makeCellView({ id: 's' });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const validate = jest.fn(() => true);
    const function_ = canConnect({ validate });
    const result = function_(sourceView, undefined, targetView, undefined, 'target', linkView);
    expect(result).toBe(true);
    expect(validate).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ id: 's' }),
        target: expect.objectContaining({ id: 't' }),
        endType: 'target',
        paper: expect.anything(),
        graph: expect.anything(),
      })
    );
  });

  it('returns false from validate', () => {
    const sourceView = makeCellView({ id: 's' });
    const targetView = makeCellView({ id: 't' });
    const linkView = { model: {} } as any;
    const validate = jest.fn(() => false);
    const function_ = canConnect({ validate });
    expect(function_(sourceView, undefined, targetView, undefined, 'target', linkView)).toBe(false);
  });
});
