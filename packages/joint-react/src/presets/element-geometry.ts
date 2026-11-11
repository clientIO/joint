import { g, V, type dia } from '@joint/core';

const PATH_PRECISION = 2;
const PORT_BODY_SELECTOR = 'port';

interface PortGeometryCache {
  /** The `ports` attribute the geometries were created from. */
  readonly ports: unknown;
  readonly geometries: Map<dia.Element.PortID, g.Shape | null>;
}

const portGeometryCaches = new WeakMap<dia.Element, PortGeometryCache>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Flattens the subpaths of a path into closed outlines made of lines only,
 * so that intersecting it does not subdivide curves on every call.
 * @param polylines - The flattened subpaths.
 * @returns A polygon for a single subpath, a path of closed subpaths otherwise.
 */
function createOutline(polylines: g.Polyline[]): g.Shape | null {
  const [firstPolyline] = polylines;
  if (!firstPolyline) return null;
  if (polylines.length === 1) return new g.Polygon(firstPolyline.points);
  const outline = new g.Path();
  for (const { points } of polylines) {
    const [start, ...rest] = points;
    if (!start) continue;
    outline.appendSegment(g.Path.createSegment('M', start));
    for (const point of rest) outline.appendSegment(g.Path.createSegment('L', point));
    outline.appendSegment(g.Path.createSegment('Z'));
  }
  return outline;
}

function createPathGeometry(pathData: unknown): g.Shape | null {
  if (typeof pathData !== 'string') return null;
  try {
    const path = new g.Path(V.normalizePathData(pathData));
    return createOutline(path.toPolylines({ precision: PATH_PRECISION }) ?? []);
  } catch {
    return null;
  }
}

/**
 * Creates the geometry of a port body as drawn by {@link elementPort}:
 * an `ellipse`, a `rect` or a `path` around the port center.
 * @param tagName - The tag name of the port body.
 * @param attributes - The attributes of the port body.
 * @returns The geometry relative to the port center, or `null` for any other markup.
 */
function createPortBodyGeometry(tagName: unknown, attributes: Record<string, unknown>): g.Shape | null {
  switch (tagName) {
    case 'ellipse': {
      const { rx, ry } = attributes;
      if (!isFiniteNumber(rx) || !isFiniteNumber(ry)) return null;
      return new g.Ellipse(new g.Point(0, 0), rx, ry);
    }
    case 'rect': {
      const { x, y, width, height } = attributes;
      if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height)) return null;
      return new g.Rect(x, y, width, height);
    }
    case 'path': {
      return createPathGeometry(attributes.d);
    }
    default: {
      return null;
    }
  }
}

function getPortBodyAttributes(definition: unknown): Record<string, unknown> {
  if (!isRecord(definition) || !isRecord(definition.attrs)) return {};
  const attributes = definition.attrs[PORT_BODY_SELECTOR];
  return isRecord(attributes) ? attributes : {};
}

/**
 * Finds the tag name of the port body. As in JointJS, the markup of the port
 * replaces the markup of its group.
 * @param port - The port definition.
 * @param group - The definition of the port group, if any.
 * @returns The tag name, or `null` when the markup has no port body.
 */
function getPortBodyTagName(port: Record<string, unknown>, group: unknown): unknown {
  const markup = port.markup ?? (isRecord(group) ? group.markup : null);
  if (!Array.isArray(markup)) return null;
  const body: unknown = markup.find((node: unknown) => isRecord(node) && node.selector === PORT_BODY_SELECTOR);
  return isRecord(body) ? body.tagName : null;
}

function createPortGeometry(ports: unknown, portId: dia.Element.PortID): g.Shape | null {
  if (!isRecord(ports) || !Array.isArray(ports.items)) return null;
  const port: unknown = ports.items.find((item: unknown) => isRecord(item) && item.id === portId);
  if (!isRecord(port)) return null;
  const group = (isRecord(ports.groups) && typeof port.group === 'string') ? ports.groups[port.group] : null;
  const tagName = getPortBodyTagName(port, group);
  return createPortBodyGeometry(tagName, { ...getPortBodyAttributes(group), ...getPortBodyAttributes(port) });
}

function getPortGeometryCache(element: dia.Element, ports: unknown): PortGeometryCache {
  const currentCache = portGeometryCaches.get(element);
  if (currentCache && currentCache.ports === ports) return currentCache;
  const cache: PortGeometryCache = { ports, geometries: new Map() };
  portGeometryCaches.set(element, cache);
  return cache;
}

function getPortGeometry(element: dia.Element, portId: dia.Element.PortID): g.Shape | null {
  const ports: unknown = element.get('ports');
  const cache = getPortGeometryCache(element, ports);
  const cachedGeometry = cache.geometries.get(portId);
  if (cachedGeometry !== undefined) return cachedGeometry;
  const geometry = createPortGeometry(ports, portId);
  cache.geometries.set(portId, geometry);
  return geometry;
}

/**
 * The default geometry of the graph created by `<GraphProvider />`, used when
 * its `elementGeometry` prop is not set or returns `null`.
 * A port drawn by {@link elementPort} gets the geometry of its shape (ellipse,
 * rectangle or path), so that links end on its boundary. The geometry is created
 * on demand and cached until the ports of the element change. Elements and
 * other ports use the default geometry (their rectangle).
 * @param args - The element and the id of its port (`null` for the element itself).
 * @param args.model - The element.
 * @param args.port - The id of the port, or `null`.
 * @returns The geometry relative to the port center, or `null` for the default geometry.
 */
export function defaultElementGeometry({ model, port }: dia.Graph.ElementGeometryCallbackArgs): g.Shape | null {
  if (port === null) return null;
  return getPortGeometry(model, port);
}
