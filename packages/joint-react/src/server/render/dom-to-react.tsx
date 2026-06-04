import { createElement, type ReactNode } from 'react';

/**
 * Converts a JointJS-built DOM subtree into React elements so the outer
 * `renderToString` serializes it in a single pass — no nested
 * `renderToStaticMarkup` (which would corrupt React's hooks dispatcher).
 *
 * Portal nodes are not converted recursively: their React content (a
 * `renderElement` / `renderLink` node) is spliced in as children, so user hooks
 * run in the outer render with the right contexts.
 */

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const STYLE_TAG = 'style';

/**
 * Standard SVG / namespaced attribute names that React expects in camelCase.
 * Names not listed here (custom attributes like `joint-selector`, `model-id`,
 * `data-*`, `aria-*`) are passed through unchanged.
 */
const SVG_ATTRIBUTE_NAME_MAP: Readonly<Record<string, string>> = {
  'xmlns:xlink': 'xmlnsXlink',
  'xlink:href': 'xlinkHref',
  'xlink:show': 'xlinkShow',
  'xlink:role': 'xlinkRole',
  'xlink:title': 'xlinkTitle',
  'xlink:actuate': 'xlinkActuate',
  'xlink:arcrole': 'xlinkArcrole',
  'xlink:type': 'xlinkType',
  'xml:space': 'xmlSpace',
  'xml:lang': 'xmlLang',
  'xml:base': 'xmlBase',
  'pointer-events': 'pointerEvents',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity',
  'stroke-miterlimit': 'strokeMiterlimit',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'vector-effect': 'vectorEffect',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'alignment-baseline': 'alignmentBaseline',
  'baseline-shift': 'baselineShift',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'font-style': 'fontStyle',
  'letter-spacing': 'letterSpacing',
  'word-spacing': 'wordSpacing',
  'paint-order': 'paintOrder',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'marker-start': 'markerStart',
  'marker-mid': 'markerMid',
  'marker-end': 'markerEnd',
  'shape-rendering': 'shapeRendering',
  'text-rendering': 'textRendering',
  'image-rendering': 'imageRendering',
  'color-interpolation': 'colorInterpolation',
  'writing-mode': 'writingMode',
  'unicode-bidi': 'unicodeBidi',
};

/** Maps a DOM attribute name to the React prop name React expects. */
function mapAttributeName(name: string): string {
  return SVG_ATTRIBUTE_NAME_MAP[name] ?? name;
}

/** Parses an inline `style` string into a React style object (camelCased keys). */
function styleStringToObject(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':');
    if (separator === -1) {
      continue;
    }
    const rawKey = declaration.slice(0, separator).trim();
    const value = declaration.slice(separator + 1).trim();
    if (rawKey === '' || value === '') {
      continue;
    }
    // CSS custom properties keep their literal `--name`; other props are camelCased.
    const key = rawKey.startsWith('--')
      ? rawKey
      : rawKey.replaceAll(/-([a-z])/g, (_, character: string) => character.toUpperCase());
    result[key] = value;
  }
  return result;
}

/** Builds React props from a DOM element's attributes. */
function attributesToProps(element: Element, key: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key };
  for (const attribute of element.attributes) {
    if (attribute.name === 'class') {
      props.className = attribute.value;
    } else if (attribute.name === 'style') {
      props.style = styleStringToObject(attribute.value);
    } else {
      // Standard SVG attributes are camelCased for React; custom attributes
      // (`joint-selector`, `model-id`, `data-*`, …) pass through unchanged.
      props[mapAttributeName(attribute.name)] = attribute.value;
    }
  }
  return props;
}

/** Mutable counter so sibling React elements get stable, unique keys. */
interface KeyCounter {
  value: number;
}

/**
 * Recursively converts a DOM node to a React node.
 * @param node - the DOM node to convert.
 * @param portalContent - map of portal DOM nodes to the React content to splice in.
 * @param counter - shared key counter.
 * @returns the converted React node (or `null` to skip).
 */
export function domNodeToReact(
  node: Node,
  portalContent: ReadonlyMap<Element, ReactNode>,
  counter: KeyCounter
): ReactNode {
  if (node.nodeType === TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== ELEMENT_NODE) {
    return null;
  }
  const element = node as Element;
  const props = attributesToProps(element, `n${counter.value++}`);

  const spliced = portalContent.get(element);
  if (spliced !== undefined) {
    return createElement(element.localName, props, spliced);
  }

  // `<style>` holds CSS text — emit it via dangerouslySetInnerHTML so React
  // doesn't escape it.
  if (element.localName === STYLE_TAG) {
    props.dangerouslySetInnerHTML = { __html: element.textContent ?? '' };
    return createElement(element.localName, props);
  }

  const children = convertChildNodes(element.childNodes, portalContent, counter);
  return createElement(element.localName, props, ...children);
}

/** Converts a node's children to React nodes, dropping empty/skipped ones. */
function convertChildNodes(
  childNodes: NodeListOf<ChildNode>,
  portalContent: ReadonlyMap<Element, ReactNode>,
  counter: KeyCounter
): ReactNode[] {
  const result: ReactNode[] = [];
  for (const childNode of childNodes) {
    const child = domNodeToReact(childNode, portalContent, counter);
    if (child != null && child !== '') {
      result.push(child);
    }
  }
  return result;
}

/**
 * Converts every child of a host element to React nodes.
 * @param host - the paper host whose children to convert.
 * @param portalContent - map of portal DOM nodes to React content to splice in.
 * @returns the converted React nodes.
 */
export function hostChildrenToReact(
  host: Element,
  portalContent: ReadonlyMap<Element, ReactNode>
): ReactNode[] {
  return convertChildNodes(host.childNodes, portalContent, { value: 0 });
}
