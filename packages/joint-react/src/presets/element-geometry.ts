import { g, V, type dia } from '@joint/core';

const PATH_PRECISION = 2;
const PORT_BODY_SELECTOR = 'port';

interface PortShape {
  /** The geometry of the port body, or `null` when it is not drawn by `elementPort()`. */
  readonly geometry: g.Shape | null;
  /** The outline (stroke) width set on the port, `0` when it comes from the stylesheet. */
  readonly outlineWidth: number;
}

interface PortShapeCache {
  /** The `ports` attribute the shapes were created from. */
  readonly ports: unknown;
  readonly shapes: Map<dia.Element.PortID, PortShape>;
}

const NO_PORT_SHAPE: PortShape = { geometry: null, outlineWidth: 0 };

const portShapeCaches = new WeakMap<dia.Element, PortShapeCache>();

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

function getOutlineWidth(groupAttributes: Record<string, unknown>, portAttributes: Record<string, unknown>): number {
  const groupStyle = isRecord(groupAttributes.style) ? groupAttributes.style : {};
  const portStyle = isRecord(portAttributes.style) ? portAttributes.style : {};
  const { strokeWidth } = { ...groupStyle, ...portStyle };
  return isFiniteNumber(strokeWidth) && strokeWidth > 0 ? strokeWidth : 0;
}

function createPortShape(ports: unknown, portId: dia.Element.PortID): PortShape {
  if (!isRecord(ports) || !Array.isArray(ports.items)) return NO_PORT_SHAPE;
  const port: unknown = ports.items.find((item: unknown) => isRecord(item) && item.id === portId);
  if (!isRecord(port)) return NO_PORT_SHAPE;
  const group = (isRecord(ports.groups) && typeof port.group === 'string') ? ports.groups[port.group] : null;
  const tagName = getPortBodyTagName(port, group);
  const groupAttributes = getPortBodyAttributes(group);
  const portAttributes = getPortBodyAttributes(port);
  const geometry = createPortBodyGeometry(tagName, { ...groupAttributes, ...portAttributes });
  if (!geometry) return NO_PORT_SHAPE;
  return { geometry, outlineWidth: getOutlineWidth(groupAttributes, portAttributes) };
}

function getPortShapeCache(element: dia.Element, ports: unknown): PortShapeCache {
  const currentCache = portShapeCaches.get(element);
  if (currentCache && currentCache.ports === ports) return currentCache;
  const cache: PortShapeCache = { ports, shapes: new Map() };
  portShapeCaches.set(element, cache);
  return cache;
}

function getPortShape(element: dia.Element, portId: dia.Element.PortID): PortShape {
  const ports: unknown = element.get('ports');
  const cache = getPortShapeCache(element, ports);
  const cachedShape = cache.shapes.get(portId);
  if (cachedShape) return cachedShape;
  const shape = createPortShape(ports, portId);
  cache.shapes.set(portId, shape);
  return shape;
}

/**
 * The outline (stroke) width set with the `outlineWidth` option of {@link elementPort}.
 * An outline that comes from the stylesheet is not known to the model.
 * @param element - The element.
 * @param portId - The id of its port.
 * @returns The outline width in pixels, or `0` when it is not set on the port.
 */
export function getPortOutlineWidth(element: dia.Element, portId: dia.Element.PortID): number {
  return getPortShape(element, portId).outlineWidth;
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
  return getPortShape(model, port).geometry;
}
